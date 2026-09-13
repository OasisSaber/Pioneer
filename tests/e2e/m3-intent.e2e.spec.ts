import { _electron as electron, expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

import {
  captureFixtureHash,
  captureFixtureHashAfterClose,
} from './fixture-integrity';

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

test('moves a project task from Input through Intent Review to READY without mutating fixtures', async ({}, testInfo) => {
  const beforeHash = await captureFixtureHash(fixtureRoot);
  const userDataDir = testInfo.outputPath('user-data');
  await mkdir(userDataDir, { recursive: true });

  const application = await electron.launch({
    executablePath: electronExecutablePath,
    args: [desktopDir],
    env: {
      ...process.env,
      PIONEER_E2E: '1',
      PIONEER_E2E_ROOT: fixtureRoot,
      PIONEER_E2E_USER_DATA: userDataDir,
    },
  });

  try {
    const page = await application.firstWindow();
    await page.getByRole('button', { name: 'Open project alpha-app' }).click();

    await expect(page.getByRole('button', { name: '输入' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('button', { name: '审阅' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '输出' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '自定' })).toBeDisabled();

    const instruction = page.getByRole('textbox', { name: '任务说明' });
    await instruction.fill('统一项目导航；先生成最小安全计划，批准前不要执行。');
    await page.getByRole('button', { name: '生成意图计划' }).click();

    await expect(
      page.getByRole('heading', { name: '意图审阅' }),
    ).toBeVisible();
    await expect(page.getByText('REV 1', { exact: true })).toBeVisible();
    await expect(page.getByText('执行尚未开始。')).toBeVisible();

    await page.getByRole('button', { name: '返回修改' }).click();
    await expect(instruction).toHaveValue(
      '统一项目导航；先生成最小安全计划，批准前不要执行。',
    );
    await instruction.fill(
      '统一项目导航；保留只读边界，并在批准前明确验证方式。',
    );
    await page.getByRole('button', { name: '生成意图计划' }).click();
    await expect(page.getByText('REV 2', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: '批准计划' }).click();
    await expect(page.getByText('READY', { exact: true })).toBeVisible();
    await expect(
      page.getByText(/尚未启动 Agent Runtime、工具执行或文件修改/),
    ).toBeVisible();
  } finally {
    try {
      await application.close();
    } finally {
      expect(await captureFixtureHashAfterClose(fixtureRoot)).toBe(beforeHash);
    }
  }
});
