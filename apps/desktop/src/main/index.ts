import { app, dialog, ipcMain } from 'electron';

import { CatalogService } from './catalog/catalog-service';
import { scanWorkspace } from './catalog/scanner';
import { registerCatalogIpc } from './ipc';
import { IPC_CHANNELS } from '../shared/contracts/ipc';
import { applyLaunchRuntimeConfig } from './runtime-config';
import { createSettingsStore } from './settings-store';
import { createMainWindow } from './window';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: ReturnType<typeof createMainWindow> | null = null;
let catalogService: CatalogService | null = null;

// This must run before app readiness can construct Chromium session state.
const launchRuntimeConfig = applyLaunchRuntimeConfig(app);

const openMainWindow = (service: CatalogService): void => {
  mainWindow = createMainWindow({
    entryUrl: MAIN_WINDOW_WEBPACK_ENTRY,
    preloadPath: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
  });

  const trustedWindow = mainWindow;
  for (const channel of Object.values(IPC_CHANNELS)) {
    ipcMain.removeHandler(channel);
  }
  registerCatalogIpc({
    expectedRendererUrl:
      new URL(MAIN_WINDOW_WEBPACK_ENTRY).protocol === 'file:'
        ? MAIN_WINDOW_WEBPACK_ENTRY
        : new URL(MAIN_WINDOW_WEBPACK_ENTRY).origin,
    ipcMain: {
      handle: (channel, handler) => {
        ipcMain.handle(channel, (event, ...args: unknown[]) =>
          handler(event, ...args),
        );
      },
    },
    mainWindow: {
      webContents: trustedWindow.webContents,
    },
    picker: {
      showOpenDialog: async (_window, options) => {
        if (launchRuntimeConfig !== null) {
          const delayMs = Number(process.env.PIONEER_E2E_PICKER_DELAY_MS ?? 0);
          if (Number.isFinite(delayMs) && delayMs > 0)
            await new Promise<void>((resolve) => {
              setTimeout(resolve, delayMs);
            });
          if (process.env.PIONEER_E2E_PICKER_MODE === 'cancel')
            return { canceled: true, filePaths: [] };
          const configuredRoot = process.env.PIONEER_E2E_PICKER_ROOT;
          if (configuredRoot !== undefined)
            return { canceled: false, filePaths: [configuredRoot] };
        }
        return dialog.showOpenDialog(trustedWindow, {
          properties: [...options.properties],
        });
      },
    },
    service,
  });
};

void app.whenReady().then(async () => {
  const baseSettings = createSettingsStore(app.getPath('userData'));
  let rejectedSave = false;
  let rejectSaveArmed = false;
  const settings =
    launchRuntimeConfig !== null &&
    process.env.PIONEER_E2E_REJECT_SAVE_ONCE === '1'
      ? {
          loadRoot: () => baseSettings.loadRoot(),
          saveRoot: async (rootPath: string) => {
            if (rejectSaveArmed && !rejectedSave) {
              rejectedSave = true;
              throw new Error('E2E settings persistence rejection.');
            }
            return baseSettings.saveRoot(rootPath);
          },
        }
      : baseSettings;
  let rejectedRescan = false;
  const beforeRescan =
    launchRuntimeConfig !== null &&
    (process.env.PIONEER_E2E_RESCAN_DELAY_MS !== undefined ||
      process.env.PIONEER_E2E_RESCAN_FAIL_ONCE === '1')
      ? async () => {
          const delayMs = Number(process.env.PIONEER_E2E_RESCAN_DELAY_MS ?? 0);
          if (Number.isFinite(delayMs) && delayMs > 0)
            await new Promise<void>((resolve) => {
              setTimeout(resolve, delayMs);
            });
          if (
            process.env.PIONEER_E2E_RESCAN_FAIL_ONCE === '1' &&
            !rejectedRescan
          ) {
            rejectedRescan = true;
            throw new Error('E2E rescan failure.');
          }
        }
      : undefined;
  catalogService = new CatalogService({
    scan: scanWorkspace,
    settings,
    beforeRescan,
  });

  if (launchRuntimeConfig !== null) {
    await catalogService.selectRoot(launchRuntimeConfig.rootPath);
    rejectSaveArmed = true;
  }

  openMainWindow(catalogService);

  app.on('activate', () => {
    if (
      catalogService !== null &&
      (mainWindow === null || mainWindow.isDestroyed())
    ) {
      openMainWindow(catalogService);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
