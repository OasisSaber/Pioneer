import type { ProjectSummary } from '../../shared/contracts/catalog';
import {
  LIBRARY_TAB_ID,
  SETTINGS_TAB_ID,
  projectTabId,
  type Tab,
  type TabId,
  type TabsState,
} from '../../shared/contracts/tabs';

export { LIBRARY_TAB_ID, SETTINGS_TAB_ID, projectTabId };
export type { Tab, TabId, TabsState } from '../../shared/contracts/tabs';

export type TabsAction =
  | { type: 'OPEN_PROJECT'; project: ProjectSummary }
  | { type: 'ACTIVATE_TAB'; tabId: TabId }
  | { type: 'CLOSE_TAB'; tabId: TabId };

export const initialTabsState: TabsState = {
  tabs: [
    { id: LIBRARY_TAB_ID, kind: 'library' },
    { id: SETTINGS_TAB_ID, kind: 'settings' },
  ],
  activeTabId: LIBRARY_TAB_ID,
  mruTabIds: [LIBRARY_TAB_ID, SETTINGS_TAB_ID],
};

const touchMru = (mruTabIds: TabId[], tabId: TabId): TabId[] => [
  tabId,
  ...mruTabIds.filter((candidate) => candidate !== tabId),
];

const makeProjectTab = (project: ProjectSummary): Tab => ({
  id: projectTabId(project.id),
  kind: 'project',
  project,
});

export function tabsReducer(state: TabsState, action: TabsAction): TabsState {
  switch (action.type) {
    case 'OPEN_PROJECT': {
      const id = projectTabId(action.project.id);
      const existing = state.tabs.some((tab) => tab.id === id);
      const tabs = existing
        ? state.tabs.map((tab): Tab =>
            tab.id === id ? makeProjectTab(action.project) : tab,
          )
        : [...state.tabs, makeProjectTab(action.project)];
      return {
        tabs,
        activeTabId: id,
        mruTabIds: touchMru(state.mruTabIds, id),
      };
    }
    case 'ACTIVATE_TAB': {
      if (!state.tabs.some((tab) => tab.id === action.tabId)) return state;
      return {
        ...state,
        activeTabId: action.tabId,
        mruTabIds: touchMru(state.mruTabIds, action.tabId),
      };
    }
    case 'CLOSE_TAB': {
      if (action.tabId === LIBRARY_TAB_ID || action.tabId === SETTINGS_TAB_ID)
        return state;
      if (!state.tabs.some((tab) => tab.id === action.tabId)) return state;

      const tabs = state.tabs.filter((tab) => tab.id !== action.tabId);
      const mruTabIds = state.mruTabIds.filter(
        (tabId) => tabId !== action.tabId,
      );
      if (state.activeTabId !== action.tabId)
        return { ...state, tabs, mruTabIds };

      const hasProjectTab = tabs.some((tab) => tab.kind === 'project');
      const activeTabId = hasProjectTab
        ? (mruTabIds.find((tabId) => tabs.some((tab) => tab.id === tabId)) ??
          LIBRARY_TAB_ID)
        : LIBRARY_TAB_ID;
      return { tabs, activeTabId, mruTabIds: touchMru(mruTabIds, activeTabId) };
    }
  }
}
