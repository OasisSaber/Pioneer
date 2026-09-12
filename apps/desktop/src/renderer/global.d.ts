declare module '*.css';

interface Window {
  pioneer: import('../shared/contracts/ipc').PioneerDesktopApi;
}
