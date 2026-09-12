import { isAbsolute } from 'node:path';
import type { CatalogResult } from '../../shared/contracts/catalog';
import { CatalogResultSchema } from '../../shared/validation';
import { normalizeRootPath } from './path-policy';
import type { SettingsStore } from '../settings-store';

export interface CatalogServiceOptions {
  settings: Pick<SettingsStore, 'loadRoot' | 'saveRoot'>;
  scan(rootPath: string): Promise<CatalogResult>;
  validateRoot?(rootPath: string): boolean;
  initialCatalog?: CatalogResult;
  now?: () => Date;
  /** Development-only hook used by the real Electron state regression seam. */
  beforeRescan?: () => Promise<void>;
}

const emptyCatalog = (): CatalogResult => ({
  rootPath: null,
  projects: [],
  warnings: [],
  scannedAt: null,
});

function rootUnavailable(rootPath: string, scannedAt: string): CatalogResult {
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

function hasUnavailableRoot(result: CatalogResult): boolean {
  return result.warnings.some((warning) => warning.code === 'ROOT_UNAVAILABLE');
}

function defaultRootValidation(rootPath: string): boolean {
  return rootPath.trim().length > 0 && isAbsolute(rootPath);
}

/** Serializes catalog mutations so an older scan cannot overwrite a later root selection. */
export class CatalogService {
  private activeRoot: string | null;
  private initialized = false;
  private initializationPromise: Promise<CatalogResult> | null = null;
  private lastGoodCatalog: CatalogResult;
  private latestResponse: CatalogResult;
  private operationQueue: Promise<void> = Promise.resolve();
  private rescanPromise: Promise<CatalogResult> | null = null;

  public constructor(private readonly options: CatalogServiceOptions) {
    const initial = options.initialCatalog
      ? CatalogResultSchema.parse(options.initialCatalog)
      : emptyCatalog();
    this.activeRoot = initial.rootPath;
    this.lastGoodCatalog = initial;
    this.latestResponse = initial;
  }

  /** Latest renderer response, including a stable unavailable-root state. */
  public getCurrentCatalog(): CatalogResult {
    return this.latestResponse;
  }

  /** Last successfully scanned catalog, retained privately from unavailable responses. */
  public getLastGoodCatalog(): CatalogResult {
    return this.lastGoodCatalog;
  }

  public getCatalog(): Promise<CatalogResult> {
    if (this.initializationPromise !== null) return this.initializationPromise;
    if (this.initialized) return Promise.resolve(this.latestResponse);

    this.initialized = true;
    this.initializationPromise = this.enqueue(async () => {
      const rememberedRoot = await this.options.settings.loadRoot();
      if (rememberedRoot === null) return this.latestResponse;
      try {
        return await this.scanAndRecord(this.requireValidRoot(rememberedRoot));
      } catch {
        return this.recordUnavailable(rememberedRoot);
      }
    }).finally(() => {
      this.initializationPromise = null;
    });
    return this.initializationPromise;
  }

  public async selectRoot(rootPath: string): Promise<CatalogResult> {
    const normalizedRoot = this.requireValidRoot(rootPath);
    this.initialized = true;
    return this.enqueue(async () => {
      await this.options.settings.saveRoot(normalizedRoot);
      this.activeRoot = normalizedRoot;
      return this.scanAndRecord(normalizedRoot);
    });
  }

  public rescan(): Promise<CatalogResult> {
    if (this.rescanPromise !== null) return this.rescanPromise;
    this.rescanPromise = this.rescanInternal().finally(() => {
      this.rescanPromise = null;
    });
    return this.rescanPromise;
  }

  private async rescanInternal(): Promise<CatalogResult> {
    if (this.options.beforeRescan !== undefined)
      await this.options.beforeRescan();
    if (this.initializationPromise !== null) return this.initializationPromise;
    if (!this.initialized && this.activeRoot === null) return this.getCatalog();
    return this.enqueue(async () =>
      this.activeRoot === null
        ? this.latestResponse
        : this.scanAndRecord(this.activeRoot),
    );
  }

  private enqueue(
    operation: () => Promise<CatalogResult>,
  ): Promise<CatalogResult> {
    const queued = this.operationQueue.then(operation, operation);
    this.operationQueue = queued.then(
      () => undefined,
      () => undefined,
    );
    return queued;
  }

  private requireValidRoot(rootPath: string): string {
    if (
      !this.options.validateRoot?.(rootPath) &&
      this.options.validateRoot !== undefined
    ) {
      throw new Error('invalid workspace root');
    }
    if (
      this.options.validateRoot === undefined &&
      !defaultRootValidation(rootPath)
    ) {
      throw new Error('invalid workspace root');
    }
    return normalizeRootPath(rootPath);
  }

  private async scanAndRecord(rootPath: string): Promise<CatalogResult> {
    try {
      const result = CatalogResultSchema.parse(
        await this.options.scan(rootPath),
      );
      return hasUnavailableRoot(result)
        ? this.recordUnavailable(rootPath, result)
        : this.recordSuccess(result);
    } catch {
      return this.recordUnavailable(rootPath);
    }
  }

  private recordSuccess(result: CatalogResult): CatalogResult {
    const validated = CatalogResultSchema.parse(result);
    this.activeRoot = validated.rootPath;
    this.lastGoodCatalog = validated;
    this.latestResponse = validated;
    return validated;
  }

  private recordUnavailable(
    rootPath: string,
    result = rootUnavailable(
      rootPath,
      (this.options.now ?? (() => new Date()))().toISOString(),
    ),
  ): CatalogResult {
    const validated = CatalogResultSchema.parse(result);
    this.activeRoot = rootPath;
    this.latestResponse = validated;
    return validated;
  }
}
