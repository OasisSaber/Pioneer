import type { CatalogResult } from './catalog';

export const IPC_CHANNELS = {
  selectRoot: 'catalog:select-root',
  getCatalog: 'catalog:get',
  rescan: 'catalog:rescan',
} as const;

/** Every catalog IPC request is deliberately payload-free. */
export type EmptyIpcRequest = readonly [];

export interface PioneerDesktopApi {
  selectRoot(): Promise<CatalogResult | null>;
  getCatalog(): Promise<CatalogResult>;
  rescan(): Promise<CatalogResult>;
}
