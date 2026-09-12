import { useCallback, useEffect, useRef, useState } from 'react';

import type { CatalogResult } from '../../shared/contracts/catalog';

export type CatalogStatus = 'loading' | 'empty' | 'ready' | 'partial' | 'error';

export interface CatalogState {
  status: CatalogStatus;
  result: CatalogResult | null;
  stale: boolean;
  error: string | null;
  busy: boolean;
  operation: 'loading' | 'choosing' | 'rescanning' | null;
}

export interface UseCatalogResult extends CatalogState {
  chooseRoot: () => Promise<void>;
  rescan: () => Promise<void>;
}

/** Shares an in-flight renderer operation and always releases it after settle. */
export function createSingleFlightRunner<T>(): (
  operation: () => Promise<T>,
) => Promise<T> {
  let active: Promise<T> | null = null;
  return (operation) => {
    if (active !== null) return active;
    active = operation().finally(() => {
      active = null;
    });
    return active;
  };
}

const initialState: CatalogState = {
  status: 'loading',
  result: null,
  stale: false,
  error: null,
  busy: true,
  operation: 'loading',
};

const errorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'The workspace catalog could not be loaded.';

const hasUnavailableRoot = (result: CatalogResult): boolean =>
  result.warnings.some((warning) => warning.code === 'ROOT_UNAVAILABLE');

function availableState(result: CatalogResult): CatalogState {
  if (result.rootPath === null) {
    return {
      status: 'empty',
      result,
      stale: false,
      error: null,
      busy: false,
      operation: null,
    };
  }
  return {
    status:
      result.warnings.length > 0
        ? 'partial'
        : result.projects.length > 0
          ? 'ready'
          : 'empty',
    result,
    stale: false,
    error: null,
    busy: false,
    operation: null,
  };
}

function resolveCatalog(
  previous: CatalogState,
  next: CatalogResult,
): CatalogState {
  if (!hasUnavailableRoot(next)) return availableState(next);

  const unavailableMessage =
    next.warnings.find((warning) => warning.code === 'ROOT_UNAVAILABLE')
      ?.message ?? 'The workspace root is unavailable.';
  if (previous.result?.rootPath !== null && previous.result !== null) {
    return { ...previous, stale: true, error: unavailableMessage };
  }
  return {
    status: 'error',
    result: null,
    stale: false,
    error: unavailableMessage,
    busy: false,
    operation: null,
  };
}

export function useCatalog(): UseCatalogResult {
  const [state, setState] = useState<CatalogState>(initialState);
  const mounted = useRef(true);
  const requestedInitialCatalog = useRef(false);
  const operationRunner = useRef(createSingleFlightRunner<unknown>()).current;

  useEffect(() => {
    mounted.current = true;
    if (requestedInitialCatalog.current)
      return () => {
        mounted.current = false;
      };

    requestedInitialCatalog.current = true;
    const initialRequest = window.pioneer.getCatalog();
    void initialRequest
      .then(
        (result) => {
          if (mounted.current)
            setState((previous) => resolveCatalog(previous, result));
        },
        (error: unknown) => {
          if (mounted.current)
            setState((previous) => ({
              ...previous,
              status: 'error',
              error: errorMessage(error),
            }));
        },
      )
      .finally(() => {
        if (mounted.current)
          setState((previous) => ({
            ...previous,
            busy: false,
            operation: null,
          }));
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  const chooseRoot = useCallback(async (): Promise<void> => {
    await operationRunner(() => {
      setState((previous) => ({
        ...previous,
        busy: true,
        operation: 'choosing',
      }));
      return window.pioneer
        .selectRoot()
        .then((result) => {
          if (result !== null && mounted.current)
            setState((previous) => resolveCatalog(previous, result));
        })
        .catch((error: unknown) => {
          if (mounted.current)
            setState((previous) => ({
              ...previous,
              status: 'error',
              error: errorMessage(error),
            }));
        })
        .finally(() => {
          if (mounted.current)
            setState((previous) => ({
              ...previous,
              busy: false,
              operation: null,
            }));
        });
    });
  }, [operationRunner]);

  const rescan = useCallback(async (): Promise<void> => {
    await operationRunner(() => {
      setState((previous) => ({
        ...previous,
        busy: true,
        operation: 'rescanning',
      }));
      return window.pioneer
        .rescan()
        .then((result) => {
          if (mounted.current)
            setState((previous) => resolveCatalog(previous, result));
        })
        .catch((error: unknown) => {
          if (mounted.current)
            setState((previous) => ({
              ...previous,
              status: 'error',
              error: errorMessage(error),
            }));
        })
        .finally(() => {
          if (mounted.current)
            setState((previous) => ({
              ...previous,
              busy: false,
              operation: null,
            }));
        });
    });
  }, [operationRunner]);

  return { ...state, chooseRoot, rescan };
}
