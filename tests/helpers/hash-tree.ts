import { createHash } from 'node:crypto';
import { readdir, readFile, readlink } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

type TreeEntry = {
  relativePath: string;
  kind: 'directory' | 'file' | 'symlink' | 'other';
  absolutePath: string;
};

async function collectEntries(
  root: string,
  directory: string,
  entries: TreeEntry[],
): Promise<void> {
  const children = await readdir(directory, { withFileTypes: true });
  for (const entry of children.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const fullPath = resolve(directory, entry.name);
    const relativePath = relative(root, fullPath).replaceAll('\\', '/');
    if (entry.isSymbolicLink()) {
      entries.push({ relativePath, kind: 'symlink', absolutePath: fullPath });
    } else if (entry.isDirectory()) {
      entries.push({ relativePath, kind: 'directory', absolutePath: fullPath });
      await collectEntries(root, fullPath, entries);
    } else if (entry.isFile()) {
      entries.push({ relativePath, kind: 'file', absolutePath: fullPath });
    } else {
      entries.push({ relativePath, kind: 'other', absolutePath: fullPath });
    }
  }
}

/** A deterministic manifest digest that never follows links. */
export async function hashFixtureTree(root: string): Promise<string> {
  const absoluteRoot = resolve(root);
  const entries: TreeEntry[] = [];
  await collectEntries(absoluteRoot, absoluteRoot, entries);
  const hash = createHash('sha256');
  for (const entry of entries.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  )) {
    hash.update(entry.kind);
    hash.update('\0');
    hash.update(entry.relativePath);
    hash.update('\0');
    if (entry.kind === 'file') hash.update(await readFile(entry.absolutePath));
    else if (entry.kind === 'symlink')
      hash.update(await readlink(entry.absolutePath));
    hash.update('\0');
  }
  return hash.digest('hex');
}
