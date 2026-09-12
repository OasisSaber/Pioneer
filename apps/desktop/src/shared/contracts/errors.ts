/** Stable warning codes emitted by the workspace catalog scanner. */
export const CATALOG_WARNING_CODES = [
  'ROOT_UNAVAILABLE',
  'CHILD_UNREADABLE',
  'OUTSIDE_ROOT_LINK',
  'METADATA_INVALID',
] as const;

export type CatalogWarningCode = (typeof CATALOG_WARNING_CODES)[number];

/** A serializable warning associated with a root or child path. */
export interface CatalogWarning {
  code: CatalogWarningCode;
  path: string;
  message: string;
}
