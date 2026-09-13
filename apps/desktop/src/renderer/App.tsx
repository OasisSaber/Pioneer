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
  const projectTabs = tabs.tabs.filter((tab) => tab.kind === 'project');

  return (
    <main aria-label="Pioneer workspace" className="app-shell">
      <TabStrip dispatch={dispatch} state={tabs} />

      {activeTab?.kind === 'library' ? (
        <section
          aria-labelledby={`tab-${activeTab.id}`}
          className="workspace-panel"
          id={`panel-${activeTab.id}`}
          role="tabpanel"
        >
          <ProjectLibrary
            {...catalog}
            onOpenProject={(project) => {
              dispatch({ type: 'OPEN_PROJECT', project });
            }}
          />
        </section>
      ) : null}

      {activeTab?.kind === 'settings' ? (
        <section
          aria-labelledby={`tab-${activeTab.id}`}
          className="workspace-panel"
          id={`panel-${activeTab.id}`}
          role="tabpanel"
        >
          <SettingsView
            chooseRoot={catalog.chooseRoot}
            busy={catalog.busy}
            error={catalog.error}
            rootPath={catalog.result?.rootPath ?? null}
            stale={catalog.stale}
            warnings={catalog.result?.warnings ?? []}
          />
        </section>
      ) : null}

      {projectTabs.map((tab) => (
        <section
          aria-labelledby={`tab-${tab.id}`}
          className="workspace-panel"
          hidden={tabs.activeTabId !== tab.id}
          id={`panel-${tab.id}`}
          key={tab.id}
          role="tabpanel"
        >
          <ProjectWorkspace project={tab.project} />
        </section>
      ))}
    </main>
  );
};
