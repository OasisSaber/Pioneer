import { useReducer } from 'react';

import { ProjectLibrary } from './components/ProjectLibrary';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { SettingsView } from './components/SettingsView';
import { TabStrip } from './components/TabStrip';
import { useCatalog } from './hooks/use-catalog';
import { initialTabsState, tabsReducer } from './state/tabs-reducer';

export const App = (): React.JSX.Element => {
  const catalog = useCatalog();
  const [tabs, dispatch] = useReducer(tabsReducer, initialTabsState);
  const activeTab =
    tabs.tabs.find((tab) => tab.id === tabs.activeTabId) ?? tabs.tabs[0];

  return (
    <main aria-label="Pioneer workspace" className="app-shell">
      <TabStrip dispatch={dispatch} state={tabs} />
      {activeTab === undefined ? null : (
        <section
          aria-labelledby={`tab-${activeTab.id}`}
          className="workspace-panel"
          id={`panel-${activeTab.id}`}
          role="tabpanel"
        >
          {activeTab.kind === 'library' ? (
            <ProjectLibrary
              {...catalog}
              onOpenProject={(project) => {
                dispatch({ type: 'OPEN_PROJECT', project });
              }}
            />
          ) : activeTab.kind === 'settings' ? (
            <SettingsView
              chooseRoot={catalog.chooseRoot}
              busy={catalog.busy}
              error={catalog.error}
              rootPath={catalog.result?.rootPath ?? null}
              stale={catalog.stale}
              warnings={catalog.result?.warnings ?? []}
            />
          ) : (
            <ProjectWorkspace project={activeTab.project} />
          )}
        </section>
      )}
    </main>
  );
};
