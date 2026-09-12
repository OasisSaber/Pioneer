import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  PACKAGED_CONTENT_SECURITY_POLICY,
  contentSecurityPolicy,
  isPackagedRendererUrl,
} from '../../apps/desktop/src/main/security';

const rendererHtmlPath = fileURLToPath(
  new URL('../../apps/desktop/src/renderer/index.html', import.meta.url),
);
const rendererWebpackPath = fileURLToPath(
  new URL('../../apps/desktop/webpack.renderer.config.ts', import.meta.url),
);
const preloadPath = fileURLToPath(
  new URL('../../apps/desktop/src/preload/index.ts', import.meta.url),
);

describe('desktop security delivery', () => {
  it('injects an in-document CSP only into production renderer output and retains an exact Forge origin only in development', async () => {
    const [rendererHtml, rendererWebpack] = await Promise.all([
      readFile(rendererHtmlPath, 'utf8'),
      readFile(rendererWebpackPath, 'utf8'),
    ]);
    expect(rendererHtml).not.toContain('Content-Security-Policy');
    expect(rendererWebpack).toContain('PackagedCspMetaPlugin');
    expect(rendererWebpack).toContain(PACKAGED_CONTENT_SECURITY_POLICY);
    expect(PACKAGED_CONTENT_SECURITY_POLICY).not.toMatch(/localhost|ws:|\*/);
    expect(contentSecurityPolicy('file:///C:/Pioneer/index.html')).toBe(
      PACKAGED_CONTENT_SECURITY_POLICY,
    );
    expect(
      contentSecurityPolicy('http://localhost:3017/main_window'),
    ).toContain('http://localhost:3017');
    expect(
      contentSecurityPolicy('http://localhost:3017/main_window'),
    ).toContain('ws://localhost:3017');
    expect(
      contentSecurityPolicy('http://localhost:3017/main_window'),
    ).not.toContain('*');
    expect(isPackagedRendererUrl('file:///C:/Pioneer/index.html')).toBe(true);
    expect(isPackagedRendererUrl('http://localhost:3017/main_window')).toBe(
      false,
    );
  });

  it('keeps preload to the three declared fixed-channel invokes and publishes only pioneer', async () => {
    const source = await readFile(preloadPath, 'utf8');
    expect(source.match(/ipcRenderer\.invoke/g) ?? []).toHaveLength(3);
    expect(source).toContain("contextBridge.exposeInMainWorld('pioneer', api)");
    expect(source).not.toMatch(/ipcRenderer\.(send|on|once|removeListener)/);
    expect(source).toContain('getCatalog:');
    expect(source).toContain('rescan:');
    expect(source).toContain('selectRoot:');
  });
});
