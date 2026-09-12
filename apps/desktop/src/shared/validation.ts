import { z } from 'zod';
import { CATALOG_WARNING_CODES } from './contracts/errors';

const isoTimestamp = z.iso.datetime({ offset: true });

export const CatalogWarningCodeSchema = z.enum(CATALOG_WARNING_CODES);

export const CatalogWarningSchema = z
  .object({
    code: CatalogWarningCodeSchema,
    path: z.string(),
    message: z.string(),
  })
  .strict();

export const ProjectSummarySchema = z
  .object({
    id: z.string().min(1),
    name: z.string(),
    absolutePath: z.string(),
    description: z.string().nullable(),
    technologies: z.array(z.string()),
    hasGitRepository: z.boolean(),
    lastModifiedAt: isoTimestamp,
    coverSeed: z.string().min(1),
  })
  .strict();

export const CatalogResultSchema = z
  .object({
    rootPath: z.string().nullable(),
    projects: z.array(ProjectSummarySchema),
    warnings: z.array(CatalogWarningSchema),
    scannedAt: isoTimestamp.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.warnings.some((warning) => warning.code === 'ROOT_UNAVAILABLE') &&
      value.projects.length > 0
    ) {
      context.addIssue({
        code: 'custom',
        path: ['projects'],
        message: 'ROOT_UNAVAILABLE results must not contain projects.',
      });
    }
  });

/** Runtime representation of the zero-payload tuple required by every IPC handler. */
export const EmptyIpcRequestSchema = z.tuple([]);

export type CatalogWarningCodeInput = z.infer<typeof CatalogWarningCodeSchema>;
export type CatalogWarningInput = z.infer<typeof CatalogWarningSchema>;
export type ProjectSummaryInput = z.infer<typeof ProjectSummarySchema>;
export type CatalogResultInput = z.infer<typeof CatalogResultSchema>;
