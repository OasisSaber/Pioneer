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

  return (
    <main aria-label="Pioneer workspace" className="app-shell">
      <TabStrip dispatch={dispatch} state={tabs} />
      {tabs.tabs.map((tab) => (
        <section
          aria-labelledby={`tab-${tab.id}`}
          className="workspace-panel"
          hidden={tabs.activeTabId !== tab.id}
          id={`panel-${tab.id}`}
          key={tab.id}
          role="tabpanel"
        >
          {tab.kind === 'library' ? (
            <ProjectLibrary
              {...catalog}
              onOpenProject={(project) => {
                dispatch({ type: 'OPEN_PROJECT', project });
              }}
            />
          ) : tab.kind === 'settings' ? (
            <SettingsView
              chooseRoot={catalog.chooseRoot}
              busy={catalog.busy}
              error={catalog.error}
              rootPath={catalog.result?.rootPath ?? null}
              stale={catalog.stale}
              warnings={catalog.result?.warnings ?? []}
            />
          ) : (
            <ProjectWorkspace project={tab.project} />
          )}
        </section>
      ))}
    </main>
  );
};
