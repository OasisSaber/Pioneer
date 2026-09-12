import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  SETTINGS_FILE_NAME,
  createSettingsStore,
} from '../../apps/desktop/src/main/settings-store';

const temporaryDirectories: string[] = [];

async function createUserDataDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'pioneer-settings-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('isolated settings store', () => {
  it('recovers with null when no settings record exists', async () => {
    const userDataPath = await createUserDataDirectory();
    await expect(
      createSettingsStore(userDataPath).loadRoot(),
    ).resolves.toBeNull();
  });

  it('persists only rootPath below the injected userData directory with an atomic sibling replacement', async () => {
    const userDataPath = await createUserDataDirectory();
    const store = createSettingsStore(userDataPath);

    await store.saveRoot('C:\\workspace');

    const files = await readdir(userDataPath);
    expect(files).toEqual([SETTINGS_FILE_NAME]);
    expect(
      JSON.parse(
        await readFile(join(userDataPath, SETTINGS_FILE_NAME), 'utf8'),
      ),
    ).toEqual({ rootPath: 'C:\\workspace' });
    await expect(store.loadRoot()).resolves.toBe('C:\\workspace');
  });

  it('keeps the existing record when temporary sibling replacement fails', async () => {
    const userDataPath = await createUserDataDirectory();
    await createSettingsStore(userDataPath).saveRoot('C:\\before');
    const writes: string[] = [];
    const failingStore = createSettingsStore(userDataPath, {
      mkdir,
      readFile,
      rename: () => Promise.reject(new Error('simulated replacement failure')),
      rm,
      writeFile: async (path, data, options) => {
        writes.push(path);
        return writeFile(path, data, options);
      },
    });

    await expect(failingStore.saveRoot('C:\\after')).rejects.toThrow(
      'simulated replacement failure',
    );
    await expect(createSettingsStore(userDataPath).loadRoot()).resolves.toBe(
      'C:\\before',
    );
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatch(
      new RegExp(`^${userDataPath.replace(/\\/g, '\\\\')}`),
    );
    expect(await readdir(userDataPath)).toEqual([SETTINGS_FILE_NAME]);
  });
  it('fails closed to null for corrupt or schema-invalid records', async () => {
    const userDataPath = await createUserDataDirectory();
    const settingsPath = join(userDataPath, SETTINGS_FILE_NAME);

    await writeFile(settingsPath, '{ definitely not JSON', 'utf8');
    await expect(
      createSettingsStore(userDataPath).loadRoot(),
    ).resolves.toBeNull();

    await writeFile(
      settingsPath,
      JSON.stringify({ rootPath: 'C:\\workspace', unexpected: true }),
      'utf8',
    );
    await expect(
      createSettingsStore(userDataPath).loadRoot(),
    ).resolves.toBeNull();
  });
});
