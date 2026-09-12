import { describe, expect, it } from 'vitest';
import type { ProjectSummary } from '../../apps/desktop/src/shared/contracts/catalog';
import {
  LIBRARY_TAB_ID,
  SETTINGS_TAB_ID,
  projectTabId,
} from '../../apps/desktop/src/shared/contracts/tabs';
import {
  initialTabsState,
  tabsReducer,
  type TabsAction,
} from '../../apps/desktop/src/renderer/state/tabs-reducer';

const project = (id: string): ProjectSummary => ({
  id,
  name: `Project ${id}`,
  absolutePath: `C:\\workspaces\\${id}`,
  description: null,
  technologies: ['TypeScript'],
  hasGitRepository: true,
  lastModifiedAt: '2026-09-05T02:00:00.000Z',
  coverSeed: `cover-${id}`,
});

const dispatch = (actions: TabsAction[]) =>
  actions.reduce(tabsReducer, initialTabsState);

describe('deterministic project tab reducer', () => {
  it('starts with fixed Library and Settings tabs', () => {
    expect(initialTabsState.tabs.map((tab) => tab.id)).toEqual([
      LIBRARY_TAB_ID,
      SETTINGS_TAB_ID,
    ]);
    expect(initialTabsState.activeTabId).toBe(LIBRARY_TAB_ID);
    expect(initialTabsState.mruTabIds).toEqual([
      LIBRARY_TAB_ID,
      SETTINGS_TAB_ID,
    ]);
  });

  it('opens a project, activates it, and stores the shared ProjectSummary', () => {
    const next = dispatch([
      { type: 'OPEN_PROJECT', project: project('alpha') },
    ]);
    expect(next.activeTabId).toBe(projectTabId('alpha'));
    expect(next.tabs.find((tab) => tab.id === projectTabId('alpha'))).toEqual({
      id: projectTabId('alpha'),
      kind: 'project',
      project: project('alpha'),
    });
  });

  it('does not duplicate an already-open project and moves it to the MRU front', () => {
    const next = dispatch([
      { type: 'OPEN_PROJECT', project: project('alpha') },
      { type: 'OPEN_PROJECT', project: project('beta') },
      {
        type: 'OPEN_PROJECT',
        project: { ...project('alpha'), name: 'Updated alpha' },
      },
    ]);
    expect(
      next.tabs.filter((tab) => tab.id === projectTabId('alpha')),
    ).toHaveLength(1);
    const updated = next.tabs.find((tab) => tab.id === projectTabId('alpha'));
    expect(updated?.kind === 'project' ? updated.project.name : undefined).toBe(
      'Updated alpha',
    );
    expect(next.mruTabIds[0]).toBe(projectTabId('alpha'));
  });

  it('activates an existing tab and updates MRU order without duplicates', () => {
    const next = dispatch([
      { type: 'OPEN_PROJECT', project: project('alpha') },
      { type: 'OPEN_PROJECT', project: project('beta') },
      { type: 'ACTIVATE_TAB', tabId: LIBRARY_TAB_ID },
    ]);
    expect(next.activeTabId).toBe(LIBRARY_TAB_ID);
    expect(next.mruTabIds).toEqual([
      LIBRARY_TAB_ID,
      projectTabId('beta'),
      projectTabId('alpha'),
      SETTINGS_TAB_ID,
    ]);
  });

  it('closing a background tab preserves the active tab', () => {
    const next = dispatch([
      { type: 'OPEN_PROJECT', project: project('alpha') },
      { type: 'OPEN_PROJECT', project: project('beta') },
      { type: 'CLOSE_TAB', tabId: projectTabId('alpha') },
    ]);
    expect(next.activeTabId).toBe(projectTabId('beta'));
    expect(next.tabs.some((tab) => tab.id === projectTabId('alpha'))).toBe(
      false,
    );
  });

  it('closing the active tab selects the most-recent valid tab, then Library', () => {
    const one = dispatch([
      { type: 'OPEN_PROJECT', project: project('alpha') },
      { type: 'OPEN_PROJECT', project: project('beta') },
      { type: 'ACTIVATE_TAB', tabId: projectTabId('alpha') },
      { type: 'CLOSE_TAB', tabId: projectTabId('alpha') },
    ]);
    expect(one.activeTabId).toBe(projectTabId('beta'));
    const fallback = tabsReducer(one, {
      type: 'CLOSE_TAB',
      tabId: projectTabId('beta'),
    });
    expect(fallback.activeTabId).toBe(LIBRARY_TAB_ID);
  });

  it('falls back to Library when closing the only project after Settings was active', () => {
    const next = dispatch([
      { type: 'ACTIVATE_TAB', tabId: SETTINGS_TAB_ID },
      { type: 'OPEN_PROJECT', project: project('alpha') },
      { type: 'CLOSE_TAB', tabId: projectTabId('alpha') },
    ]);
    expect(next.activeTabId).toBe(LIBRARY_TAB_ID);
  });

  it('does not close fixed tabs and ignores unknown activation/close targets', () => {
    const fixed = tabsReducer(initialTabsState, {
      type: 'CLOSE_TAB',
      tabId: LIBRARY_TAB_ID,
    });
    expect(fixed).toEqual(initialTabsState);
    expect(
      tabsReducer(initialTabsState, {
        type: 'ACTIVATE_TAB',
        tabId: projectTabId('missing'),
      }),
    ).toEqual(initialTabsState);
  });
});
