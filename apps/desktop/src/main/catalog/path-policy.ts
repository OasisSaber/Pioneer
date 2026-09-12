import { createHash } from 'node:crypto';
import { isAbsolute, relative, resolve, sep } from 'node:path';

/** Produces the canonical logical path used at the catalog boundary. */
export function normalizeRootPath(input: string): string {
  const normalized = resolve(input);
  return /^[a-z]:/.test(normalized)
    ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
    : normalized;
}

/** Tests containment by path components, never by a vulnerable string prefix. */
export function isPathInsideRoot(root: string, candidate: string): boolean {
  const relativePath = relative(
    normalizeRootPath(root),
    normalizeRootPath(candidate),
  );
  return (
    relativePath === '' ||
    (!relativePath.startsWith(`..${sep}`) &&
      relativePath !== '..' &&
      !isAbsolute(relativePath))
  );
}

/** Stable identity for a physical project location, independent of discovery order. */
export function projectIdFromPath(normalizedPath: string): string {
  return createHash('sha256')
    .update(normalizeRootPath(normalizedPath), 'utf8')
    .digest('hex');
}
