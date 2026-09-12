import type { CatalogWarning } from './errors';

export type { CatalogWarning, CatalogWarningCode } from './errors';

export interface ProjectSummary {
  id: string;
  name: string;
  absolutePath: string;
  description: string | null;
  technologies: string[];
  hasGitRepository: boolean;
  lastModifiedAt: string;
  coverSeed: string;
}

export interface CatalogResult {
  rootPath: string | null;
  projects: ProjectSummary[];
  warnings: CatalogWarning[];
  scannedAt: string | null;
}
