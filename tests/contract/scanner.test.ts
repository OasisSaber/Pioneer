import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type {
  CatalogFs,
  DirentLike,
} from '../../apps/desktop/src/main/catalog/fs-adapter';
import { nodeCatalogFs } from '../../apps/desktop/src/main/catalog/fs-adapter';
import { scanWorkspace } from '../../apps/desktop/src/main/catalog/scanner';
import { hashFixtureTree } from '../helpers/hash-tree';

const ROOT = 'C:\\library';
const instant = new Date('2026-09-05T02:01:00.000Z');

function directory(
  name: string,
  options: { isDirectory?: boolean; isSymbolicLink?: boolean } = {},
): DirentLike {
  return {
    name,
    isDirectory: () => options.isDirectory ?? true,
    isSymbolicLink: () => options.isSymbolicLink ?? false,
  };
}

function file(name: string): DirentLike {
  return { name, isDirectory: () => false, isSymbolicLink: () => false };
}

function fixtureFs(
  options: {
    entries?: readonly DirentLike[];
    realpaths?: Record<string, string | Error>;
    texts?: Record<string, string | Error>;
    inaccessible?: readonly string[];
    nonRegular?: readonly string[];
    mtimes?: Record<string, Date>;
    readdirPaths?: string[];
  } = {},
): CatalogFs {
  const readdirPaths = options.readdirPaths ?? [];
  const realpaths = options.realpaths ?? {};
  const texts = options.texts ?? {};
  const inaccessible = new Set(options.inaccessible ?? []);
  const nonRegular = new Set(options.nonRegular ?? []);
  const mtimes = options.mtimes ?? {};
  const valueAt = <T>(
    values: Record<string, T | Error>,
    path: string,
    fallback: T,
  ): T => {
    const value = values[path] ?? fallback;
    if (value instanceof Error) throw value;
    return value;
  };

  return {
    readdir: (path) => {
      readdirPaths.push(path);
      if (path !== ROOT) {
        return Promise.reject(new Error(`unexpected recursive read: ${path}`));
      }
      return Promise.resolve(
        options.entries ?? [
          directory('alpha-app'),
          directory('beta-notes'),
          file('ignored.txt'),
        ],
      );
    },
    realpath: (path) =>
      Promise.resolve().then(() => valueAt(realpaths, path, path)),
    readTextPrefix: (path, maxBytes) => {
      expect(maxBytes).toBe(65_536);
      return Promise.resolve().then(() => valueAt(texts, path, ''));
    },
    stat: (path) =>
      Promise.resolve({
        mtime: mtimes[path] ?? instant,
        isDirectory: () =>
          !path.endsWith('package.json') && !path.endsWith('README.md'),
        isFile: () =>
          !nonRegular.has(path) &&
          (path.endsWith('package.json') || path.endsWith('README.md')),
      }),
    access: (path) => {
      if (inaccessible.has(path)) return Promise.reject(new Error('not found'));
      return Promise.resolve();
    },
  };
}

describe('one-level read-only workspace scanner', () => {
  it('scans immediate directories only, ignores files, and keeps fixtures unchanged', async () => {
    const fixtureRoot = fileURLToPath(
      new URL('../fixtures/workspaces/library', import.meta.url),
    );
    const before = await hashFixtureTree(fixtureRoot);
    const readdirPaths: string[] = [];
    const result = await scanWorkspace(ROOT, {
      fs: fixtureFs({ readdirPaths }),
    });
    const after = await hashFixtureTree(fixtureRoot);

    expect(result.projects.map((project) => project.name)).toEqual([
      'alpha-app',
      'beta-notes',
    ]);
    expect(readdirPaths).toEqual([ROOT]);
    expect(before).toBe(after);
  });

  it('uses package metadata before README metadata and sorts newest first', async () => {
    const alpha = `${ROOT}\\alpha-app`;
    const beta = `${ROOT}\\beta-notes`;
    const result = await scanWorkspace(ROOT, {
      fs: fixtureFs({
        texts: {
          [`${alpha}\\package.json`]: JSON.stringify({
            description: 'Package description',
            dependencies: { electron: '1', zod: '1' },
            devDependencies: { electron: '1', typescript: '1', vite: '1' },
            peerDependencies: { react: '1' },
            optionalDependencies: { sharp: '1' },
          }),
          [`${alpha}\\README.md`]: '# Alpha\n\nREADME description',
          [`${beta}\\README.md`]:
            '# Beta\n\nBeta first paragraph.\n\nAnother paragraph.',
        },
        mtimes: {
          [alpha]: new Date('2026-09-04T02:00:00.000Z'),
          [beta]: new Date('2026-09-05T02:00:00.000Z'),
        },
      }),
    });

    expect(result.projects.map((project) => project.name)).toEqual([
      'beta-notes',
      'alpha-app',
    ]);
    expect(result.projects[0]).toMatchObject({
      description: 'Beta first paragraph.',
      technologies: [],
    });
    expect(result.projects[1]).toMatchObject({
      description: 'Package description',
      technologies: [
        'electron',
        'react',
        'sharp',
        'typescript',
        'vite',
        'zod',
      ],
    });
  });

  it('keeps siblings when metadata is invalid or a child is unreadable', async () => {
    const broken = `${ROOT}\\broken-metadata`;
    const unreadable = `${ROOT}\\unreadable`;
    const result = await scanWorkspace(ROOT, {
      fs: fixtureFs({
        entries: [
          directory('alpha-app'),
          directory('broken-metadata'),
          directory('unreadable'),
        ],
        texts: { [`${broken}\\package.json`]: '{ not json' },
        realpaths: { [unreadable]: new Error('EACCES') },
      }),
    });

    expect(result.projects.map((project) => project.name)).toEqual([
      'alpha-app',
      'broken-metadata',
    ]);
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      'METADATA_INVALID',
      'CHILD_UNREADABLE',
    ]);
  });

  it('returns a serializable unavailable-root result instead of throwing', async () => {
    const result = await scanWorkspace('C:\\missing', {
      fs: fixtureFs({ realpaths: { 'C:\\missing': new Error('ENOENT') } }),
      now: () => instant,
    });
    expect(result).toMatchObject({
      rootPath: null,
      projects: [],
      scannedAt: instant.toISOString(),
    });
    expect(result.warnings[0]).toMatchObject({
      code: 'ROOT_UNAVAILABLE',
      path: 'C:\\missing',
    });
  });

  it('accepts an in-root link only after realpath containment and skips unsafe links', async () => {
    const safe = `${ROOT}\\safe-link`;
    const outside = `${ROOT}\\outside-link`;
    const broken = `${ROOT}\\broken-link`;
    const result = await scanWorkspace(ROOT, {
      fs: fixtureFs({
        entries: [
          directory('safe-link', { isSymbolicLink: true }),
          directory('outside-link', { isSymbolicLink: true }),
          directory('broken-link', { isSymbolicLink: true }),
        ],
        realpaths: {
          [safe]: `${ROOT}\\real-project`,
          [outside]: 'D:\\outside\\project',
          [broken]: new Error('ENOENT'),
        },
      }),
    });

    expect(result.projects.map((project) => project.absolutePath)).toEqual([
      `${ROOT}\\real-project`,
    ]);
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      'CHILD_UNREADABLE',
      'OUTSIDE_ROOT_LINK',
    ]);
  });

  it('rejects link-only directory entries unless their canonical target is a directory', async () => {
    const result = await scanWorkspace(ROOT, {
      fs: fixtureFs({
        entries: [
          directory('link-only', { isDirectory: false, isSymbolicLink: true }),
        ],
        realpaths: { [`${ROOT}\\link-only`]: `${ROOT}\\real-project` },
        mtimes: { [`${ROOT}\\real-project`]: instant },
      }),
    });

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]?.absolutePath).toBe(`${ROOT}\\real-project`);
  });

  it('deduplicates direct directories and aliases by canonical physical identity', async () => {
    const direct = `${ROOT}\\real-project`;
    const aliases = ['a-alias', 'z-alias'];
    const scan = (entries: readonly DirentLike[]) =>
      scanWorkspace(ROOT, {
        fs: fixtureFs({
          entries,
          realpaths: Object.fromEntries(
            aliases.map((name) => [`${ROOT}\\${name}`, direct]),
          ),
          mtimes: { [direct]: instant },
        }),
      });
    const result = await scan([
      directory('z-alias', { isDirectory: false, isSymbolicLink: true }),
      directory('real-project'),
      directory('a-alias', { isDirectory: false, isSymbolicLink: true }),
    ]);
    const reversed = await scan([
      directory('a-alias', { isDirectory: false, isSymbolicLink: true }),
      directory('real-project'),
      directory('z-alias', { isDirectory: false, isSymbolicLink: true }),
    ]);

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]).toMatchObject({
      name: 'real-project',
      absolutePath: direct,
    });
    expect(reversed.projects).toEqual(result.projects);
  });

  it('reads allowed in-root metadata links through their canonical target', async () => {
    const project = `${ROOT}\\alpha-app`;
    const packagePath = `${project}\\package.json`;
    const target = `${ROOT}\\shared\\package.json`;
    const result = await scanWorkspace(ROOT, {
      fs: fixtureFs({
        entries: [directory('alpha-app')],
        realpaths: { [packagePath]: target },
        texts: {
          [target]: JSON.stringify({ description: 'In-root link' }),
        },
      }),
    });

    expect(result.projects[0]).toMatchObject({
      description: 'In-root link',
      technologies: [],
    });
    expect(result.warnings).toEqual([]);
  });

  it('rejects non-regular metadata sources without opening them', async () => {
    const packagePath = `${ROOT}\\alpha-app\\package.json`;
    const result = await scanWorkspace(ROOT, {
      fs: fixtureFs({
        entries: [directory('alpha-app')],
        nonRegular: [packagePath],
      }),
    });

    expect(result.projects[0]).toMatchObject({
      description: null,
      technologies: [],
    });
    expect(result.warnings.map((item) => item.code)).toContain(
      'METADATA_INVALID',
    );
  });

  it('does not read metadata links that resolve outside the selected root', async () => {
    const project = `${ROOT}\\alpha-app`;
    const packagePath = `${project}\\package.json`;
    const readmePath = `${project}\\README.md`;
    const gitPath = `${project}\\.git`;
    const readPaths: string[] = [];
    const fs = fixtureFs({
      entries: [directory('alpha-app')],
      realpaths: {
        [packagePath]: 'D:\\secrets\\package.json',
        [readmePath]: 'D:\\secrets\\README.md',
        [gitPath]: 'D:\\secrets\\.git',
      },
    });
    const guardedFs: CatalogFs = {
      ...fs,
      readTextPrefix: (path, maxBytes) => {
        readPaths.push(path);
        return fs.readTextPrefix(path, maxBytes);
      },
    };

    const result = await scanWorkspace(ROOT, { fs: guardedFs });

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]).toMatchObject({
      description: null,
      technologies: [],
      hasGitRepository: false,
    });
    expect(
      result.warnings.filter((item) => item.code === 'OUTSIDE_ROOT_LINK'),
    ).toHaveLength(3);
    expect(readPaths).toEqual([]);
  });

  it('preserves accessible metadata siblings when one package link escapes', async () => {
    const project = `${ROOT}\\alpha-app`;
    const packagePath = `${project}\\package.json`;
    const readmePath = `${project}\\README.md`;
    const result = await scanWorkspace(ROOT, {
      fs: fixtureFs({
        entries: [directory('alpha-app')],
        realpaths: { [packagePath]: 'D:\\secrets\\package.json' },
        texts: { [readmePath]: '# Alpha\n\nSafe README metadata' },
      }),
    });

    expect(result.projects[0]?.description).toBe('Safe README metadata');
    expect(result.warnings.map((item) => item.code)).toEqual([
      'OUTSIDE_ROOT_LINK',
    ]);
  });

  it('enforces metadata link containment on the real filesystem', async () => {
    const container = await mkdtemp(
      join(process.env.TEMP ?? 'C:\\Temp', 'pioneer-real-metadata-'),
    );
    const selectedRoot = join(container, 'library');
    const project = join(selectedRoot, 'project');
    const secret = join(container, 'secret.md');
    try {
      await mkdir(project, { recursive: true });
      await writeFile(secret, 'OUTSIDE TEST MARKER');
      await symlink(secret, join(project, 'README.md'));

      const result = await scanWorkspace(selectedRoot, { fs: nodeCatalogFs });

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0]?.description).toBeNull();
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'OUTSIDE_ROOT_LINK' }),
        ]),
      );
    } finally {
      await rm(container, { recursive: true, force: true });
    }
  });

  it('exposes no write operations through the filesystem adapter', () => {
    const fs = fixtureFs();
    expect(Object.keys(fs).sort()).toEqual([
      'access',
      'readTextPrefix',
      'readdir',
      'realpath',
      'stat',
    ]);
  });
});
