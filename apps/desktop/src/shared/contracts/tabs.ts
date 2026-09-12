import type { ProjectSummary } from './catalog';

export const LIBRARY_TAB_ID = 'library' as const;
export const SETTINGS_TAB_ID = 'settings' as const;

export const projectTabId = (projectId: string): `project:${string}` =>
  `project:${projectId}`;

export type FixedTabId = typeof LIBRARY_TAB_ID | typeof SETTINGS_TAB_ID;
export type ProjectTabId = `project:${string}`;
export type TabId = FixedTabId | ProjectTabId;

export interface LibraryTab {
  id: typeof LIBRARY_TAB_ID;
  kind: 'library';
}

export interface SettingsTab {
  id: typeof SETTINGS_TAB_ID;
  kind: 'settings';
}

export interface ProjectTab {
  id: ProjectTabId;
  kind: 'project';
  project: ProjectSummary;
}

export type Tab = LibraryTab | SettingsTab | ProjectTab;

export interface TabsState {
  tabs: Tab[];
  activeTabId: TabId;
  mruTabIds: TabId[];
}
