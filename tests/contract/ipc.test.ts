import { describe, expect, it, vi } from 'vitest';
import type { CatalogResult } from '../../apps/desktop/src/shared/contracts/catalog';
import { IPC_CHANNELS } from '../../apps/desktop/src/shared/contracts/ipc';
import { CatalogService } from '../../apps/desktop/src/main/catalog/catalog-service';
import type { SettingsStore } from '../../apps/desktop/src/main/settings-store';
import {
  registerCatalogIpc,
  type CatalogIpcDependencies,
  type IpcInvokeEventLike,
} from '../../apps/desktop/src/main/ipc';

const ROOT = 'C:\\workspace';
const OTHER_ROOT = 'C:\\other-workspace';
const EXPECTED_URL = 'http://localhost:3000/main_window';

const catalogFor = (rootPath: string): CatalogResult => ({
  rootPath,
  projects: [],
  warnings: [],
  scannedAt: '2026-09-05T02:01:00.000Z',
});

const unavailableFor = (rootPath: string): CatalogResult => ({
  rootPath: null,
  projects: [],
  warnings: [
    {
      code: 'ROOT_UNAVAILABLE',
      path: rootPath,
      message: 'Workspace root is unavailable.',
    },
  ],
  scannedAt: '2026-09-05T02:01:00.000Z',
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createService(
  options: {
    rememberedRoot?: string | null;
    scan?: (rootPath: string) => Promise<CatalogResult>;
    initialCatalog?: CatalogResult;
    validateRoot?: (rootPath: string) => boolean;
  } = {},
) {
  const loadRoot = vi.fn<SettingsStore['loadRoot']>(() =>
    Promise.resolve(options.rememberedRoot ?? ROOT),
  );
  const saveRoot = vi.fn<SettingsStore['saveRoot']>(() => Promise.resolve());
  const settings = { loadRoot, saveRoot } satisfies Pick<
    SettingsStore,
    'loadRoot' | 'saveRoot'
  >;
  const scan = vi.fn(
    options.scan ??
      ((rootPath: string) => Promise.resolve(catalogFor(rootPath))),
  );
  return {
    settings,
    scan,
    service: new CatalogService({
      initialCatalog: options.initialCatalog,
      scan,
      settings,
      validateRoot: options.validateRoot,
    }),
  };
}

function createIpcHarness(
  dependencies: Omit<
    CatalogIpcDependencies,
    'ipcMain' | 'mainWindow' | 'expectedRendererUrl'
  >,
) {
  const handlers = new Map<
    string,
    (event: IpcInvokeEventLike, ...args: unknown[]) => Promise<unknown>
  >();
  const mainFrame = { url: EXPECTED_URL };
  const webContents = { id: 42, getURL: () => EXPECTED_URL, mainFrame };
  registerCatalogIpc({
    ...dependencies,
    expectedRendererUrl: EXPECTED_URL,
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    mainWindow: { webContents },
  });
  const legitimateEvent = (): IpcInvokeEventLike => ({
    sender: webContents,
    senderFrame: mainFrame,
  });
  return { handlers, legitimateEvent, mainFrame, webContents };
}

describe('CatalogService', () => {
  it('loads a remembered root exactly once for initial getCatalog', async () => {
    const { service, settings, scan } = createService();

    await expect(service.getCatalog()).resolves.toEqual(catalogFor(ROOT));
    await expect(service.getCatalog()).resolves.toEqual(catalogFor(ROOT));

    expect(settings.loadRoot).toHaveBeenCalledTimes(1);
    expect(scan).toHaveBeenCalledTimes(1);
  });

  it('shares one remembered-root initialization across concurrent getCatalog calls', async () => {
    const { service, settings, scan } = createService();

    await expect(
      Promise.all([service.getCatalog(), service.getCatalog()]),
    ).resolves.toEqual([catalogFor(ROOT), catalogFor(ROOT)]);
    expect(settings.loadRoot).toHaveBeenCalledTimes(1);
    expect(scan).toHaveBeenCalledTimes(1);
  });
  it('serializes a delayed remembered-root scan before a later selection, leaving the later root current', async () => {
    const rememberedScan = deferred<CatalogResult>();
    const { service, scan } = createService({
      scan: (rootPath) =>
        rootPath === ROOT
          ? rememberedScan.promise
          : Promise.resolve(catalogFor(rootPath)),
    });

    const initial = service.getCatalog();
    const selected = service.selectRoot(OTHER_ROOT);
    await vi.waitFor(() => {
      expect(scan).toHaveBeenCalledWith(ROOT);
    });
    rememberedScan.resolve(catalogFor(ROOT));

    await expect(initial).resolves.toEqual(catalogFor(ROOT));
    await expect(selected).resolves.toEqual(catalogFor(OTHER_ROOT));
    await expect(service.getCatalog()).resolves.toEqual(catalogFor(OTHER_ROOT));
    expect(scan).toHaveBeenLastCalledWith(OTHER_ROOT);
  });

  it('makes cold concurrent rescans share initialization without a second scan or empty result', async () => {
    const scanResult = deferred<CatalogResult>();
    const { service, scan } = createService({
      scan: () => scanResult.promise,
    });

    const first = service.rescan();
    const second = service.rescan();
    const read = service.getCatalog();
    await vi.waitFor(() => {
      expect(scan).toHaveBeenCalledTimes(1);
    });
    scanResult.resolve(catalogFor(ROOT));

    await expect(Promise.all([first, second, read])).resolves.toEqual([
      catalogFor(ROOT),
      catalogFor(ROOT),
      catalogFor(ROOT),
    ]);
    expect(scan).toHaveBeenCalledTimes(1);
  });
  it('validates and scans a selected root before persisting it', async () => {
    const calls: string[] = [];
    const { service, settings, scan } = createService({
      validateRoot: (rootPath) => {
        calls.push(`validate:${rootPath}`);
        return rootPath === OTHER_ROOT;
      },
    });
    settings.saveRoot.mockImplementation((rootPath: string) => {
      calls.push(`save:${rootPath}`);
      return Promise.resolve();
    });
    scan.mockImplementation((rootPath: string) => {
      calls.push(`scan:${rootPath}`);
      return Promise.resolve(catalogFor(rootPath));
    });

    await expect(service.selectRoot(OTHER_ROOT)).resolves.toEqual(
      catalogFor(OTHER_ROOT),
    );
    expect(calls).toEqual([
      `validate:${OTHER_ROOT}`,
      `scan:${OTHER_ROOT}`,
      `save:${OTHER_ROOT}`,
    ]);
    await expect(service.selectRoot('relative-path')).rejects.toThrow(
      'invalid workspace root',
    );
    expect(settings.saveRoot).toHaveBeenCalledTimes(1);
  });

  it('keeps the last successful catalog in memory when a remembered root becomes unavailable', async () => {
    const stale = catalogFor(ROOT);
    const { service } = createService({
      initialCatalog: stale,
      rememberedRoot: OTHER_ROOT,
      scan: () => Promise.resolve(unavailableFor(OTHER_ROOT)),
    });

    await expect(service.getCatalog()).resolves.toEqual(
      unavailableFor(OTHER_ROOT),
    );
    expect(service.getLastGoodCatalog()).toEqual(stale);
  });

  it('keeps the latest unavailable response across repeated reads while retaining the last-good catalog', async () => {
    const stale = catalogFor(ROOT);
    const { service } = createService({
      initialCatalog: stale,
      rememberedRoot: OTHER_ROOT,
      scan: () => Promise.resolve(unavailableFor(OTHER_ROOT)),
    });

    await expect(service.getCatalog()).resolves.toEqual(
      unavailableFor(OTHER_ROOT),
    );
    await expect(service.getCatalog()).resolves.toEqual(
      unavailableFor(OTHER_ROOT),
    );
    expect(service.getLastGoodCatalog()).toEqual(stale);
  });
  it('propagates an unexpected scanner failure without misclassifying it as root availability', async () => {
    const { service } = createService({
      scan: () => Promise.reject(new Error('scanner invariant failed')),
    });

    await expect(service.getCatalog()).rejects.toThrow('scanner invariant failed');
  });
  it('shares one in-flight rescan promise', async () => {
    const next = deferred<CatalogResult>();
    const { service, scan } = createService({
      initialCatalog: catalogFor(ROOT),
      scan: () => next.promise,
    });

    const first = service.rescan();
    const second = service.rescan();
    expect(first).toBe(second);
    await vi.waitFor(() => {
      expect(scan).toHaveBeenCalledTimes(1);
    });
    next.resolve(catalogFor(ROOT));
    await expect(first).resolves.toEqual(catalogFor(ROOT));
  });
});

describe('catalog IPC registration', () => {
  it('registers only the declared channels and handles the trusted main frame', async () => {
    const { service } = createService();
    const picker = vi.fn(() =>
      Promise.resolve({ canceled: false, filePaths: [ROOT] }),
    );
    const harness = createIpcHarness({
      picker: { showOpenDialog: picker },
      service,
    });

    expect([...harness.handlers.keys()].sort()).toEqual(
      Object.values(IPC_CHANNELS).sort(),
    );
    await expect(
      harness.handlers.get(IPC_CHANNELS.getCatalog)?.(
        harness.legitimateEvent(),
      ),
    ).resolves.toEqual(catalogFor(ROOT));
    await expect(
      harness.handlers.get(IPC_CHANNELS.selectRoot)?.(
        harness.legitimateEvent(),
      ),
    ).resolves.toEqual(catalogFor(ROOT));
  });

  it('accepts the exact packaged file URL from the trusted main frame', async () => {
    const { service } = createService();
    const picker = vi.fn(() =>
      Promise.resolve({ canceled: true, filePaths: [] }),
    );
    const fileUrl =
      'file:///C:/Pioneer/resources/app/.webpack/renderer/main_window/index.html';
    const handlers = new Map<
      string,
      (event: IpcInvokeEventLike, ...args: unknown[]) => Promise<unknown>
    >();
    const mainFrame = { url: fileUrl };
    const webContents = { id: 42, getURL: () => fileUrl, mainFrame };
    registerCatalogIpc({
      expectedRendererUrl: fileUrl,
      ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
      mainWindow: { webContents },
      picker: { showOpenDialog: picker },
      service,
    });

    await expect(
      handlers.get(IPC_CHANNELS.getCatalog)?.({
        sender: webContents,
        senderFrame: mainFrame,
      }),
    ).resolves.toEqual(catalogFor(ROOT));
  });
  it('returns null on picker cancellation without changing the catalog or root', async () => {
    const { service, settings, scan } = createService({
      initialCatalog: catalogFor(ROOT),
    });
    const picker = vi.fn(() =>
      Promise.resolve({ canceled: true, filePaths: [] }),
    );
    const harness = createIpcHarness({
      picker: { showOpenDialog: picker },
      service,
    });

    await expect(
      harness.handlers.get(IPC_CHANNELS.selectRoot)?.(
        harness.legitimateEvent(),
      ),
    ).resolves.toBeNull();
    expect(settings.saveRoot).not.toHaveBeenCalled();
    expect(scan).not.toHaveBeenCalled();
    expect(service.getCurrentCatalog()).toEqual(catalogFor(ROOT));
  });

  it('rejects foreign, child-frame, and navigated senders before service activity', async () => {
    const { service, scan } = createService();
    const picker = vi.fn(() =>
      Promise.resolve({ canceled: false, filePaths: [ROOT] }),
    );
    const harness = createIpcHarness({
      picker: { showOpenDialog: picker },
      service,
    });
    const getCatalog = harness.handlers.get(IPC_CHANNELS.getCatalog);
    if (getCatalog === undefined)
      throw new Error('getCatalog was not registered');

    await expect(
      getCatalog({
        sender: { ...harness.webContents, id: 99 },
        senderFrame: harness.mainFrame,
      }),
    ).rejects.toThrow('Untrusted IPC sender');
    await expect(
      getCatalog({
        sender: harness.webContents,
        senderFrame: { url: EXPECTED_URL },
      }),
    ).rejects.toThrow('Untrusted IPC sender');
    await expect(
      getCatalog({ sender: harness.webContents, senderFrame: null }),
    ).rejects.toThrow('Untrusted IPC sender');
    await expect(
      getCatalog({
        sender: {
          ...harness.webContents,
          getURL: () => 'https://attacker.invalid/',
        },
        senderFrame: harness.mainFrame,
      }),
    ).rejects.toThrow('Untrusted IPC sender');
    expect(scan).not.toHaveBeenCalled();
  });

  it('rejects unexpected payloads before picker or filesystem access', async () => {
    const { service, scan } = createService();
    const picker = vi.fn(() =>
      Promise.resolve({ canceled: false, filePaths: [ROOT] }),
    );
    const harness = createIpcHarness({
      picker: { showOpenDialog: picker },
      service,
    });

    await expect(
      harness.handlers.get(IPC_CHANNELS.selectRoot)?.(
        harness.legitimateEvent(),
        'unexpected',
      ),
    ).rejects.toThrow('Invalid IPC request');
    expect(picker).not.toHaveBeenCalled();
    expect(scan).not.toHaveBeenCalled();
  });
});
