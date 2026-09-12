import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyLaunchRuntimeConfig,
  resolveLaunchRuntimeConfig,
} from '../../apps/desktop/src/main/runtime-config';

const temporaryDirectories: string[] = [];

async function createDisjointDirectories(): Promise<{
  rootPath: string;
  userDataPath: string;
}> {
  const container = await mkdtemp(join(tmpdir(), 'pioneer-runtime-'));
  temporaryDirectories.push(container);
  const rootPath = join(container, 'fixture-root');
  const userDataPath = join(container, 'electron-state');
  await Promise.all([
    mkdir(rootPath, { recursive: true }),
    mkdir(userDataPath, { recursive: true }),
  ]);
  return { rootPath, userDataPath };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('launch-only runtime configuration', () => {
  it.each([
    { isPackaged: false, PIONEER_E2E: undefined },
    { isPackaged: false, PIONEER_E2E: 'true' },
    { isPackaged: false, PIONEER_E2E: '01' },
    { isPackaged: true, PIONEER_E2E: '1' },
  ])(
    'ignores malformed E2E variables outside the exact unpackaged guard %#',
    ({ isPackaged, PIONEER_E2E }) => {
      expect(
        resolveLaunchRuntimeConfig(isPackaged, {
          PIONEER_E2E,
          PIONEER_E2E_ROOT: 'not-an-absolute-root',
          PIONEER_E2E_USER_DATA: 'not-an-absolute-user-data-path',
        }),
      ).toBeNull();
    },
  );

  it('does not apply malformed packaged overrides to the production userData path', () => {
    const setPath = vi.fn();

    expect(
      applyLaunchRuntimeConfig(
        { isPackaged: true, setPath },
        {
          PIONEER_E2E: '1',
          PIONEER_E2E_ROOT: 'malformed-root',
          PIONEER_E2E_USER_DATA: 'malformed-user-data',
        },
      ),
    ).toBeNull();
    expect(setPath).not.toHaveBeenCalled();
  });

  it('fails closed when enabled variables are missing, relative, or unavailable', async () => {
    const { rootPath, userDataPath } = await createDisjointDirectories();

    expect(() =>
      resolveLaunchRuntimeConfig(false, { PIONEER_E2E: '1' }),
    ).toThrow('PIONEER_E2E_ROOT');
    expect(() =>
      resolveLaunchRuntimeConfig(false, {
        PIONEER_E2E: '1',
        PIONEER_E2E_ROOT: 'relative-root',
        PIONEER_E2E_USER_DATA: userDataPath,
      }),
    ).toThrow('PIONEER_E2E_ROOT');
    expect(() =>
      resolveLaunchRuntimeConfig(false, {
        PIONEER_E2E: '1',
        PIONEER_E2E_ROOT: rootPath,
      }),
    ).toThrow('PIONEER_E2E_USER_DATA');
    expect(() =>
      resolveLaunchRuntimeConfig(false, {
        PIONEER_E2E: '1',
        PIONEER_E2E_ROOT: rootPath,
        PIONEER_E2E_USER_DATA: join(userDataPath, 'missing'),
      }),
    ).toThrow('PIONEER_E2E_USER_DATA');
  });

  it('rejects either containment direction before userData can overlap the scan root', async () => {
    const container = await mkdtemp(join(tmpdir(), 'pioneer-runtime-overlap-'));
    temporaryDirectories.push(container);
    const nested = join(container, 'nested');
    await mkdir(nested, { recursive: true });

    expect(() =>
      resolveLaunchRuntimeConfig(false, {
        PIONEER_E2E: '1',
        PIONEER_E2E_ROOT: container,
        PIONEER_E2E_USER_DATA: nested,
      }),
    ).toThrow('must be disjoint');
    expect(() =>
      resolveLaunchRuntimeConfig(false, {
        PIONEER_E2E: '1',
        PIONEER_E2E_ROOT: nested,
        PIONEER_E2E_USER_DATA: container,
      }),
    ).toThrow('must be disjoint');
  });

  it('normalizes both directories and applies userData only after validation', async () => {
    const { rootPath, userDataPath } = await createDisjointDirectories();
    const setPath = vi.fn();

    const config = applyLaunchRuntimeConfig(
      { isPackaged: false, setPath },
      {
        PIONEER_E2E: '1',
        PIONEER_E2E_ROOT: join(rootPath, '.'),
        PIONEER_E2E_USER_DATA: join(userDataPath, '.'),
      },
    );

    expect(config).toEqual({ rootPath, userDataPath });
    expect(setPath).toHaveBeenCalledOnce();
    expect(setPath).toHaveBeenCalledWith('userData', userDataPath);

    setPath.mockClear();
    expect(() =>
      applyLaunchRuntimeConfig(
        { isPackaged: false, setPath },
        {
          PIONEER_E2E: '1',
          PIONEER_E2E_ROOT: rootPath,
          PIONEER_E2E_USER_DATA: rootPath,
        },
      ),
    ).toThrow('must be disjoint');
    expect(setPath).not.toHaveBeenCalled();
  });
});
