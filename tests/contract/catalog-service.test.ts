import { describe, expect, it } from 'vitest';

import {
  CatalogInternalScanError,
  CatalogService,
} from '../../apps/desktop/src/main/catalog/catalog-service';
import { normalizeRootPath } from '../../apps/desktop/src/main/catalog/path-policy';
import type { CatalogResult } from '../../apps/desktop/src/shared/contracts/catalog';

const scannedAt = '2026-09-13T00:00:00.000Z';

function catalogFor(rootPath: string): CatalogResult {
  return {
    rootPath,
    projects: [],
    warnings: [],
    scannedAt,
  };
}

function unavailableFor(rootPath: string): CatalogResult {
  return {
    rootPath: null,
    projects: [],
    warnings: [
      {
        code: 'ROOT_UNAVAILABLE',
        path: rootPath,
        message: 'Workspace root is unavailable.',
      },
    ],
    scannedAt,
  };
}

function settings(saved: string[] = []) {
  return {
    loadRoot: () => Promise.resolve(null),
    saveRoot: (rootPath: string) => {
      saved.push(rootPath);
      return Promise.resolve();
    },
  };
}

describe('CatalogService root transactions', () => {
  it('propagates unexpected scanner failures without disguising them as unavailable roots', async () => {
    const activeRoot = normalizeRootPath('active-root');
    const initial = catalogFor(activeRoot);
    const saved: string[] = [];
    const service = new CatalogService({
      initialCatalog: initial,
      settings: settings(saved),
      validateRoot: () => true,
      scan: () => Promise.reject(new Error('scanner exploded')),
    });

    await expect(service.selectRoot('candidate-root')).rejects.toBeInstanceOf(
      CatalogInternalScanError,
    );
    await expect(service.selectRoot('candidate-root')).rejects.toThrow(
      'Workspace catalog scan failed unexpectedly.',
    );
    expect(saved).toEqual([]);
    expect(service.getCurrentCatalog()).toEqual(initial);
    expect(service.getLastGoodCatalog()).toEqual(initial);
  });

  it('does not persist or activate an unavailable candidate root', async () => {
    const activeRoot = normalizeRootPath('active-root');
    const initial = catalogFor(activeRoot);
    const saved: string[] = [];
    const service = new CatalogService({
      initialCatalog: initial,
      settings: settings(saved),
      validateRoot: () => true,
      scan: (rootPath) => Promise.resolve(unavailableFor(rootPath)),
    });

    const candidate = normalizeRootPath('candidate-root');
    await expect(service.selectRoot('candidate-root')).resolves.toEqual(
      unavailableFor(candidate),
    );
    expect(saved).toEqual([]);
    expect(service.getCurrentCatalog()).toEqual(initial);
    expect(service.getLastGoodCatalog()).toEqual(initial);
  });

  it('keeps the active catalog unchanged when persistence fails after a successful scan', async () => {
    const activeRoot = normalizeRootPath('active-root');
    const initial = catalogFor(activeRoot);
    const service = new CatalogService({
      initialCatalog: initial,
      settings: {
        loadRoot: () => Promise.resolve(null),
        saveRoot: () => Promise.reject(new Error('settings write failed')),
      },
      validateRoot: () => true,
      scan: (rootPath) => Promise.resolve(catalogFor(rootPath)),
    });

    await expect(service.selectRoot('candidate-root')).rejects.toThrow(
      'settings write failed',
    );
    expect(service.getCurrentCatalog()).toEqual(initial);
    expect(service.getLastGoodCatalog()).toEqual(initial);
  });

  it('scans before persisting and commits the candidate only after both succeed', async () => {
    const order: string[] = [];
    const service = new CatalogService({
      settings: {
        loadRoot: () => Promise.resolve(null),
        saveRoot: (rootPath) => {
          order.push(`save:${rootPath}`);
          return Promise.resolve();
        },
      },
      validateRoot: () => true,
      scan: (rootPath) => {
        order.push(`scan:${rootPath}`);
        return Promise.resolve(catalogFor(rootPath));
      },
    });

    const candidate = normalizeRootPath('candidate-root');
    await expect(service.selectRoot('candidate-root')).resolves.toEqual(
      catalogFor(candidate),
    );
    expect(order).toEqual([`scan:${candidate}`, `save:${candidate}`]);
    expect(service.getCurrentCatalog()).toEqual(catalogFor(candidate));
    expect(service.getLastGoodCatalog()).toEqual(catalogFor(candidate));
  });

  it('surfaces an unexpected remembered-root scan failure during initialization', async () => {
    const rememberedRoot = normalizeRootPath('remembered-root');
    const service = new CatalogService({
      settings: {
        loadRoot: () => Promise.resolve(rememberedRoot),
        saveRoot: () => Promise.resolve(),
      },
      validateRoot: () => true,
      scan: () => Promise.reject(new Error('broken scanner contract')),
    });

    await expect(service.getCatalog()).rejects.toBeInstanceOf(
      CatalogInternalScanError,
    );
  });
});
