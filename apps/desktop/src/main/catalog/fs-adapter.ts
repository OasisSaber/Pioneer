import { access, open, readdir, realpath, stat } from 'node:fs/promises';
import type { Dirent } from 'node:fs';

export interface DirentLike {
  name: string;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
}

/** The scanner's deliberately read-only filesystem seam. */
export interface CatalogFs {
  readdir(path: string): Promise<readonly DirentLike[]>;
  realpath(path: string): Promise<string>;
  readTextPrefix(path: string, maxBytes: number): Promise<string>;
  stat(path: string): Promise<{
    mtime: Date;
    isDirectory(): boolean;
    isFile(): boolean;
  }>;
  access(path: string): Promise<void>;
}

async function readTextPrefix(path: string, maxBytes: number): Promise<string> {
  const handle = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(maxBytes);
    const { bytesRead } = await handle.read(buffer, 0, maxBytes, 0);
    return buffer.subarray(0, bytesRead).toString('utf8');
  } finally {
    await handle.close();
  }
}

function asDirentLike(entries: readonly Dirent[]): readonly DirentLike[] {
  return entries;
}

export const nodeCatalogFs: CatalogFs = {
  readdir: async (path) =>
    asDirentLike(await readdir(path, { withFileTypes: true })),
  realpath,
  readTextPrefix,
  stat,
  access,
};
