import { _electron as electron, expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

import {
  captureFixtureHash,
  captureFixtureHashAfterClose,
} from './fixture-integrity';

// These tests use the explicit development-only main-side picker/persistence
// seam. They exercise real Electron + preload + renderer state, not the native
// Windows directory picker; native-picker evidence remains a separate G1 gate.

const repositoryRoot = process.cwd();
const desktopDir = path.join(repositoryRoot, 'apps', 'desktop');
const fixtureRoot = path.join(
  repositoryRoot,
  'tests',
  'fixtures',
  'workspaces',
  'library',
);
const electronExecutablePath = createRequire(
  path.join(desktopDir, 'package.json'),
)('electron') as string;

async function createAlternateRoot(testInfo: {
  outputPath(path: string): string;
}) {
  const root = testInfo.outputPath('alternate-root');
  await mkdir(path.join(root, 'alternate-project'), { recursive: true });
  await writeFile(
    path.join(root, 'alternate-project', 'README.md'),
    '# Alternate\n\nA successful retry target.',
    'utf8',
  );
  return root;
}

async function launchStateApp(
  testInfo: { outputPath(path: string): string },
  overrides: Record<string, string> = {},
) {
  const userDataDir = testInfo.outputPath('user-data');
  await mkdir(userDataDir, { recursive: true });
  return electron.launch({
    executablePath: electronExecutablePath,
    args: [desktopDir],
    env: {
      ...process.env,
      PIONEER_E2E: '1',
      PIONEER_E2E_ROOT: fixtureRoot,
      PIONEER_E2E_USER_DATA: userDataDir,
      ...overrides,
    },
  });
}

async function closeAndVerify(
  application: Awaited<ReturnType<typeof electron.launch>>,
  beforeHash: string,
) {
  try {
    await application.close();
  } finally {
    expect(await captureFixtureHashAfterClose(fixtureRoot)).toBe(beforeHash);
  }
}

test('Settings keeps stale state for unavailable roots and surfaces the failure', async ({}, testInfo) => {
  const beforeHash = await captureFixtureHash(fixtureRoot);
  const unavailableRoot = path.join(testInfo.outputPath('missing-root'));
  const application = await launchStateApp(testInfo, {
    PIONEER_E2E_PICKER_ROOT: unavailableRoot,
  });
  try {
    const page = await application.firstWindow();
    await page.getByRole('tab', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Change workspace' }).click();
    const settings = page.locator('.settings-view');
    await expect(settings).toHaveAttribute('aria-busy', 'false');
    await expect(settings).toContainText('Workspace root is unavailable.');
    await expect(settings).toContainText('Showing the last available scan.');
    await expect(settings).toContainText(fixtureRoot);
  } finally {
    await closeAndVerify(application, beforeHash);
  }
});

test('Settings exposes persistence errors and succeeds on a later retry', async ({}, testInfo) => {
  const beforeHash = await captureFixtureHash(fixtureRoot);
  const alternateRoot = await createAlternateRoot(testInfo);
  const application = await launchStateApp(testInfo, {
    PIONEER_E2E_PICKER_ROOT: alternateRoot,
    PIONEER_E2E_REJECT_SAVE_ONCE: '1',
  });
  try {
    const page = await application.firstWindow();
    await page.getByRole('tab', { name: 'Settings' }).click();
    const settings = page.locator('.settings-view');
    await page.getByRole('button', { name: 'Change workspace' }).click();
    await expect(settings).toContainText('E2E settings persistence rejection.');
    await expect(settings).toContainText(fixtureRoot);

    await page.getByRole('button', { name: 'Change workspace' }).click();
    await expect(settings).toHaveAttribute('aria-busy', 'false');
    await expect(settings).toContainText(alternateRoot);
    await page.getByRole('tab', { name: 'Library' }).click();
    await expect(
      page.getByRole('button', { name: 'Open project alternate-project' }),
    ).toBeVisible();
  } finally {
    await closeAndVerify(application, beforeHash);
  }
});

test('Settings cancellation leaves the current root unchanged after deferred picker progress', async ({}, testInfo) => {
  const beforeHash = await captureFixtureHash(fixtureRoot);
  const application = await launchStateApp(testInfo, {
    PIONEER_E2E_PICKER_MODE: 'cancel',
    PIONEER_E2E_PICKER_DELAY_MS: '250',
  });
  try {
    const page = await application.firstWindow();
    await page.getByRole('tab', { name: 'Settings' }).click();
    const settings = page.locator('.settings-view');
    await page.getByRole('button', { name: 'Change workspace' }).click();
    await expect(settings).toHaveAttribute('aria-busy', 'true');
    await expect(settings).toHaveAttribute('aria-busy', 'false');
    await expect(settings).toContainText(fixtureRoot);
    await expect(settings).not.toContainText('could not');
  } finally {
    await closeAndVerify(application, beforeHash);
  }
});

test('Library exposes deferred refresh progress, coalesces repeats, recovers from failure, and switches roots', async ({}, testInfo) => {
  const beforeHash = await captureFixtureHash(fixtureRoot);
  const alternateRoot = await createAlternateRoot(testInfo);
  const application = await launchStateApp(testInfo, {
    PIONEER_E2E_RESCAN_DELAY_MS: '300',
    PIONEER_E2E_RESCAN_FAIL_ONCE: '1',
    PIONEER_E2E_PICKER_ROOT: alternateRoot,
  });
  try {
    const page = await application.firstWindow();
    const library = page.locator('.library');
    const rescan = page.getByRole('button', { name: 'Rescan' });
    await rescan.click();
    await expect(library).toHaveAttribute('aria-busy', 'true');
    await expect(library).toContainText('Refreshing project library…');

    // The second DOM event reaches the same hook while the visible button is busy.
    await rescan.evaluate((button) => {
      button.removeAttribute('disabled');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await expect(library).toContainText('E2E rescan failure.');
    await expect(library).toHaveAttribute('aria-busy', 'false');

    await rescan.click();
    await expect(library).toHaveAttribute('aria-busy', 'true');
    await expect(library).toHaveAttribute('aria-busy', 'false');
    await expect(library).not.toContainText('E2E rescan failure.');

    await page.getByRole('button', { name: 'Change workspace' }).click();
    await expect(library).toContainText(alternateRoot);
    await expect(
      page.getByRole('button', { name: 'Open project alternate-project' }),
    ).toBeVisible();
  } finally {
    await closeAndVerify(application, beforeHash);
  }
});
