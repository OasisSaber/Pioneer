import { join } from 'node:path';
import type {
  CatalogResult,
  CatalogWarning,
  ProjectSummary,
} from '../../shared/contracts/catalog';
import { nodeCatalogFs, type CatalogFs } from './fs-adapter';
import {
  MetadataInvalidError,
  MetadataNonRegularError,
  readProjectMetadata,
} from './metadata';
import {
  isPathInsideRoot,
  normalizeRootPath,
  projectIdFromPath,
} from './path-policy';

export interface ScanWorkspaceOptions {
  fs?: CatalogFs;
  now?: () => Date;
}

function warning(
  code: CatalogWarning['code'],
  path: string,
  message: string,
): CatalogWarning {
  return { code, path, message };
}

function fallbackProjectMetadata(
  lastModifiedAt: Date,
): Pick<
  ProjectSummary,
  'description' | 'technologies' | 'hasGitRepository' | 'lastModifiedAt'
> {
  return {
    description: null,
    technologies: [],
    hasGitRepository: false,
    lastModifiedAt: lastModifiedAt.toISOString(),
  };
}

function isDirectoryEntry(entry: {
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
}): boolean {
  return entry.isDirectory() || entry.isSymbolicLink();
}

function shouldPreferProject(
  current: { name: string; isAlias: boolean },
  existing: { name: string; isAlias: boolean },
): boolean {
  if (current.isAlias !== existing.isAlias) return !current.isAlias;
  return current.name.localeCompare(existing.name) < 0;
}

/** Scans one directory level and never mutates the workspace. */
export async function scanWorkspace(
  rootPath: string,
  options: ScanWorkspaceOptions = {},
): Promise<CatalogResult> {
  const fs = options.fs ?? nodeCatalogFs;
  const scannedAt = (options.now ?? (() => new Date()))().toISOString();
  const normalizedRoot = normalizeRootPath(rootPath);
  let resolvedRoot: string;

  try {
    resolvedRoot = normalizeRootPath(await fs.realpath(normalizedRoot));
  } catch {
    return {
      rootPath: null,
      projects: [],
      warnings: [
        warning(
          'ROOT_UNAVAILABLE',
          normalizedRoot,
          'Workspace root is unavailable.',
        ),
      ],
      scannedAt,
    };
  }

  let entries: readonly {
    name: string;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
  }[];
  try {
    entries = await fs.readdir(normalizedRoot);
  } catch {
    return {
      rootPath: null,
      projects: [],
      warnings: [
        warning(
          'ROOT_UNAVAILABLE',
          normalizedRoot,
          'Workspace root is unavailable.',
        ),
      ],
      scannedAt,
    };
  }

  const projectsById = new Map<
    string,
    { project: ProjectSummary; name: string; isAlias: boolean }
  >();
  const warnings: CatalogWarning[] = [];
  const candidates = entries
    .filter(isDirectoryEntry)
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of candidates) {
    const childPath = join(normalizedRoot, entry.name);
    let resolvedChild: string;
    try {
      resolvedChild = normalizeRootPath(await fs.realpath(childPath));
    } catch {
      warnings.push(
        warning(
          'CHILD_UNREADABLE',
          childPath,
          'Workspace child is unreadable.',
        ),
      );
      continue;
    }

    if (!isPathInsideRoot(resolvedRoot, resolvedChild)) {
      warnings.push(
        warning(
          'OUTSIDE_ROOT_LINK',
          childPath,
          'Workspace child resolves outside the selected root.',
        ),
      );
      continue;
    }

    let childStat: { mtime: Date; isDirectory(): boolean };
    try {
      childStat = await fs.stat(resolvedChild);
      if (!childStat.isDirectory()) {
        warnings.push(
          warning(
            'CHILD_UNREADABLE',
            childPath,
            'Workspace child is not a directory.',
          ),
        );
        continue;
      }
    } catch {
      warnings.push(
        warning(
          'CHILD_UNREADABLE',
          childPath,
          'Workspace child is unreadable.',
        ),
      );
      continue;
    }

    let metadata: Pick<
      ProjectSummary,
      'description' | 'technologies' | 'hasGitRepository' | 'lastModifiedAt'
    > & { warnings: CatalogWarning[] };
    try {
      metadata = await readProjectMetadata(resolvedChild, fs, resolvedRoot);
    } catch (error: unknown) {
      if (
        error instanceof MetadataInvalidError ||
        error instanceof MetadataNonRegularError
      ) {
        warnings.push(
          warning(
            'METADATA_INVALID',
            childPath,
            'Workspace project metadata is invalid.',
          ),
        );
        metadata = {
          ...fallbackProjectMetadata(childStat.mtime),
          warnings: [],
        };
      } else {
        warnings.push(
          warning(
            'CHILD_UNREADABLE',
            childPath,
            'Workspace child is unreadable.',
          ),
        );
        continue;
      }
    }

    const id = projectIdFromPath(resolvedChild);
    const { warnings: metadataWarnings, ...projectMetadata } = metadata;
    warnings.push(...metadataWarnings);
    const project = {
      id,
      name: entry.name,
      absolutePath: resolvedChild,
      ...projectMetadata,
      coverSeed: id,
    } satisfies ProjectSummary;
    const existing = projectsById.get(id);
    const candidate = {
      project,
      name: entry.name,
      isAlias: entry.isSymbolicLink(),
    };
    if (existing === undefined || shouldPreferProject(candidate, existing))
      projectsById.set(id, candidate);
  }

  const projects = [...projectsById.values()].map((entry) => entry.project);

  projects.sort(
    (left, right) =>
      right.lastModifiedAt.localeCompare(left.lastModifiedAt) ||
      left.name.localeCompare(right.name) ||
      left.absolutePath.localeCompare(right.absolutePath),
  );
  return { rootPath: normalizedRoot, projects, warnings, scannedAt };
}
