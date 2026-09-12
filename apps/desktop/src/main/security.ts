import type { BrowserWindow } from 'electron';

export const PACKAGED_CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";

function websocketOrigin(origin: string): string {
  return origin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
}

export function isPackagedRendererUrl(entryUrl: string): boolean {
  return new URL(entryUrl).protocol === 'file:';
}

/** Packaged pages use the renderer meta CSP; development receives an exact Forge-origin HTTP header CSP. */
export function contentSecurityPolicy(entryUrl: string): string {
  if (isPackagedRendererUrl(entryUrl)) return PACKAGED_CONTENT_SECURITY_POLICY;
  const origin = new URL(entryUrl).origin;
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'",
    `connect-src 'self' ${origin} ${websocketOrigin(origin)}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
  ].join('; ');
}

/** Blocks cross-origin navigation and every pop-up before renderer code can expand its privilege. */
export function secureMainWindow(
  mainWindow: BrowserWindow,
  entryUrl: string,
): void {
  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    if (targetUrl !== entryUrl) event.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  if (!isPackagedRendererUrl(entryUrl)) {
    mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [contentSecurityPolicy(entryUrl)],
          },
        });
      },
    );
  }
}
