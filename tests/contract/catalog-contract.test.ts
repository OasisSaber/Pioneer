import { describe, expect, it } from 'vitest';
import {
  CatalogResultSchema,
  CatalogWarningSchema,
  EmptyIpcRequestSchema,
  ProjectSummarySchema,
} from '../../apps/desktop/src/shared/validation';
import { IPC_CHANNELS } from '../../apps/desktop/src/shared/contracts/ipc';

describe('shared catalog contracts', () => {
  const project = {
    id: 'path-sha256',
    name: 'alpha-app',
    absolutePath: 'C:\\workspaces\\alpha-app',
    description: 'An example project',
    technologies: ['TypeScript', 'Electron'],
    hasGitRepository: true,
    lastModifiedAt: '2026-09-05T02:00:00.000Z',
    coverSeed: 'cover-sha256',
  };

  const result = {
    rootPath: 'C:\\workspaces',
    projects: [project],
    warnings: [],
    scannedAt: '2026-09-05T02:01:00.000Z',
  };

  it('accepts a valid project and catalog result and survives JSON round trip', () => {
    const parsed = CatalogResultSchema.parse(result);
    expect(
      CatalogResultSchema.parse(JSON.parse(JSON.stringify(parsed))),
    ).toEqual(parsed);
    expect(ProjectSummarySchema.parse(project)).toEqual(project);
  });

  it('accepts a serializable root-unavailable result without a filesystem exception', () => {
    const unavailable = {
      rootPath: null,
      projects: [],
      warnings: [
        {
          code: 'ROOT_UNAVAILABLE',
          path: 'C:\\missing',
          message: 'Workspace root is unavailable.',
        },
      ],
      scannedAt: '2026-09-05T02:01:00.000Z',
    };
    expect(CatalogResultSchema.parse(unavailable)).toEqual(unavailable);
  });

  it('rejects a root-unavailable result that contains projects', () => {
    expect(
      CatalogResultSchema.safeParse({
        ...result,
        warnings: [
          {
            code: 'ROOT_UNAVAILABLE',
            path: 'C:\\missing',
            message: 'Workspace root is unavailable.',
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects unknown warning codes', () => {
    expect(
      CatalogWarningSchema.safeParse({
        code: 'UNKNOWN',
        path: 'C:\\workspace',
        message: 'nope',
      }).success,
    ).toBe(false);
  });

  it('rejects missing project ids', () => {
    const withoutId = {
      name: project.name,
      absolutePath: project.absolutePath,
      description: project.description,
      technologies: project.technologies,
      hasGitRepository: project.hasGitRepository,
      lastModifiedAt: project.lastModifiedAt,
      coverSeed: project.coverSeed,
    };
    expect(ProjectSummarySchema.safeParse(withoutId).success).toBe(false);
  });

  it('rejects invalid timestamps', () => {
    expect(
      ProjectSummarySchema.safeParse({
        ...project,
        lastModifiedAt: 'not-a-timestamp',
      }).success,
    ).toBe(false);
    expect(
      CatalogResultSchema.safeParse({ ...result, scannedAt: 'yesterday' })
        .success,
    ).toBe(false);
  });

  it('rejects non-string paths', () => {
    expect(
      ProjectSummarySchema.safeParse({ ...project, absolutePath: 42 }).success,
    ).toBe(false);
    expect(
      CatalogResultSchema.safeParse({
        ...result,
        rootPath: ['C:', 'workspace'],
      }).success,
    ).toBe(false);
    expect(
      CatalogWarningSchema.safeParse({
        code: 'CHILD_UNREADABLE',
        path: 42,
        message: 'nope',
      }).success,
    ).toBe(false);
  });

  it('keeps every shared object strict', () => {
    expect(
      ProjectSummarySchema.safeParse({ ...project, extra: true }).success,
    ).toBe(false);
    expect(
      CatalogResultSchema.safeParse({ ...result, extra: true }).success,
    ).toBe(false);
  });
});

describe('IPC boundary contracts', () => {
  it('publishes exactly the three catalog channels', () => {
    expect(IPC_CHANNELS).toEqual({
      selectRoot: 'catalog:select-root',
      getCatalog: 'catalog:get',
      rescan: 'catalog:rescan',
    });
    expect(Object.keys(IPC_CHANNELS)).toHaveLength(3);
  });

  it('accepts only an empty argument tuple and fails closed on extra arguments', () => {
    expect(EmptyIpcRequestSchema.safeParse([]).success).toBe(true);
    expect(EmptyIpcRequestSchema.safeParse(['unexpected']).success).toBe(false);
    expect(EmptyIpcRequestSchema.safeParse([undefined]).success).toBe(false);
  });
});
