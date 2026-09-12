import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { z } from 'zod';

export const SETTINGS_FILE_NAME = 'pioneer-settings.json';

const SettingsRecordSchema = z.object({ rootPath: z.string().min(1) }).strict();

export interface SettingsStore {
  loadRoot(): Promise<string | null>;
  saveRoot(rootPath: string): Promise<void>;
}

export interface SettingsStoreFs {
  mkdir(
    path: string,
    options: { recursive: true },
  ): Promise<string | undefined>;
  readFile(path: string, encoding: 'utf8'): Promise<string>;
  rename(oldPath: string, newPath: string): Promise<void>;
  rm(path: string, options: { force: true }): Promise<void>;
  writeFile(
    path: string,
    data: string,
    options: { encoding: 'utf8'; flag: 'w' },
  ): Promise<void>;
}

const nodeSettingsStoreFs: SettingsStoreFs = {
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
};

/** The sole M2 persistence seam. Its file is always a child of the supplied userData directory. */
export function createSettingsStore(
  userDataPath: string,
  fs: SettingsStoreFs = nodeSettingsStoreFs,
): SettingsStore {
  const settingsPath = join(userDataPath, SETTINGS_FILE_NAME);

  return {
    async loadRoot(): Promise<string | null> {
      try {
        const contents = await fs.readFile(settingsPath, 'utf8');
        return SettingsRecordSchema.parse(JSON.parse(contents)).rootPath;
      } catch {
        return null;
      }
    },

    async saveRoot(rootPath: string): Promise<void> {
      const record = SettingsRecordSchema.parse({ rootPath });
      await fs.mkdir(dirname(settingsPath), { recursive: true });
      const temporaryPath = join(
        userDataPath,
        `.${SETTINGS_FILE_NAME}.${randomUUID()}.tmp`,
      );
      try {
        await fs.writeFile(temporaryPath, JSON.stringify(record), {
          encoding: 'utf8',
          flag: 'w',
        });
        await fs.rename(temporaryPath, settingsPath);
      } catch (error) {
        await fs.rm(temporaryPath, { force: true });
        throw error;
      }
    },
  };
}
