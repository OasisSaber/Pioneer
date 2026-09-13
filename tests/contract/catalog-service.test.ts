import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CatalogService } from '../../apps/desktop/src/main/catalog/catalog-service';
import type { CatalogResult } from '../../apps/desktop/src/shared/contracts/catalog';

const rootA = resolve('workspace-a');
const rootB = resolve('workspace-b');

const catalog = (rootPath: string): CatalogResult => ({
  rootPath,
  projects: [],
  warnings: [],
  scannedAt: '2026-09-13T00:00:00.000Z',
});

const unavailable = (rootPath: string): CatalogResult => ({
  rootPath: null,
  projects: [],
  warnings: [
    {
      code: 'ROOT_UNAVAILABLE',
      path: rootPath,
      message: 'Workspace root is unavailable.',
    },
  ],
  scannedAt: '2026-09-13T00:00:00.000Z',
});

describe('CatalogService root transaction boundaries', () => {
  it('does not persist or activate an unavailable root candidate', async () => {
    const saved: string[] = [];
    const service = new CatalogService({
      initialCatalog: catalog(rootA),
      settings: {
        loadRoot: () => Promise.resolve(rootA),
        saveRoot: (rootPath) => {
          saved.push(rootPath);
          return Promise.resolve();
        },
      },
      scan: (rootPath) => Promise.resolve(unavailable(rootPath)),
    });

    const result = await service.selectRoot(rootB);

    expect(result).toEqual(unavailable(rootB));
    expect(saved).toEqual([]);
    expect(service.getCurrentCatalog()).toEqual(catalog(rootA));
    expect(service.getLastGoodCatalog()).toEqual(catalog(rootA));
  });

  it('persists only after a candidate scan succeeds', async () => {
    const events: string[] = [];
    const service = new CatalogService({
      initialCatalog: catalog(rootA),
      settings: {
        loadRoot: () => Promise.resolve(rootA),
        saveRoot: (rootPath) => {
          events.push(`save:${rootPath}`);
          return Promise.resolve();
        },
      },
      scan: (rootPath) => {
        events.push(`scan:${rootPath}`);
        return Promise.resolve(catalog(rootPath));
      },
    });

    await expect(service.selectRoot(rootB)).resolves.toEqual(catalog(rootB));
    expect(events).toEqual([`scan:${rootB}`, `save:${rootB}`]);
    expect(service.getCurrentCatalog()).toEqual(catalog(rootB));
  });

  it('propagates unexpected scanner failures without relabeling them as root availability', async () => {
    const service = new CatalogService({
      initialCatalog: catalog(rootA),
      settings: {
        loadRoot: () => Promise.resolve(rootA),
        saveRoot: () => Promise.resolve(),
      },
      scan: () => Promise.reject(new Error('scanner invariant failed')),
    });

    await expect(service.selectRoot(rootB)).rejects.toThrow(
      'scanner invariant failed',
    );
    expect(service.getCurrentCatalog()).toEqual(catalog(rootA));
    expect(service.getLastGoodCatalog()).toEqual(catalog(rootA));
  });

  it('converts an invalid remembered root into a recoverable unavailable state', async () => {
    const service = new CatalogService({
      settings: {
        loadRoot: () => Promise.resolve('relative-root'),
        saveRoot: () => Promise.resolve(),
      },
      scan: (rootPath) => Promise.resolve(catalog(rootPath)),
      now: () => new Date('2026-09-13T00:00:00.000Z'),
    });

    const result = await service.getCatalog();
    expect(result.rootPath).toBeNull();
    expect(result.warnings).toEqual([
      {
        code: 'ROOT_UNAVAILABLE',
        path: 'relative-root',
        message: 'Workspace root is unavailable.',
      },
    ]);
  });

  it('records an unavailable rescan while retaining the last good catalog', async () => {
    const service = new CatalogService({
      initialCatalog: catalog(rootA),
      settings: {
        loadRoot: () => Promise.resolve(rootA),
        saveRoot: () => Promise.resolve(),
      },
      scan: (rootPath) => Promise.resolve(unavailable(rootPath)),
    });

    const result = await service.rescan();
    expect(result).toEqual(unavailable(rootA));
    expect(service.getCurrentCatalog()).toEqual(unavailable(rootA));
    expect(service.getLastGoodCatalog()).toEqual(catalog(rootA));
  });
});
