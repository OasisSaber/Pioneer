import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { readProjectMetadata } from '../../apps/desktop/src/main/catalog/metadata';
import type { CatalogFs } from '../../apps/desktop/src/main/catalog/fs-adapter';

const missing = (): NodeJS.ErrnoException => {
  const error = new Error('missing') as NodeJS.ErrnoException;
  error.code = 'ENOENT';
  return error;
};

describe('project metadata package technology detection', () => {
  it('aggregates runtime, development, peer, and optional dependencies without duplicates', async () => {
    const root = resolve('workspace');
    const project = join(root, 'alpha-app');
    const packagePath = join(project, 'package.json');
    const readmePath = join(project, 'README.md');
    const gitPath = join(project, '.git');
    const packageText = JSON.stringify({
      description: 'Alpha project',
      dependencies: { react: '1', zod: '1' },
      devDependencies: { typescript: '1', zod: '2' },
      peerDependencies: { electron: '1' },
      optionalDependencies: { sharp: '1' },
    });

    const fs: CatalogFs = {
      readdir: async () => [],
      realpath: async (path) => {
        if (path === readmePath || path === gitPath) throw missing();
        return path;
      },
      readTextPrefix: async (path) => {
        if (path === packagePath) return packageText;
        throw missing();
      },
      stat: async (path) => ({
        mtime: new Date('2026-09-13T00:00:00.000Z'),
        isDirectory: () => path === project,
        isFile: () => path === packagePath,
      }),
      access: async () => undefined,
    };

    const result = await readProjectMetadata(project, fs, root);

    expect(result.description).toBe('Alpha project');
    expect(result.technologies).toEqual([
      'electron',
      'react',
      'sharp',
      'typescript',
      'zod',
    ]);
    expect(result.hasGitRepository).toBe(false);
  });
});
