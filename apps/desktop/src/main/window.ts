import { BrowserWindow } from 'electron';
import { secureMainWindow } from './security';

export interface MainWindowOptions {
  entryUrl: string;
  preloadPath: string;
}

export const createMainWindow = ({
  entryUrl,
  preloadPath,
}: MainWindowOptions): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    height: 800,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
    },
    width: 1200,
  });

  secureMainWindow(mainWindow, entryUrl);
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  void mainWindow.loadURL(entryUrl);

  return mainWindow;
};
