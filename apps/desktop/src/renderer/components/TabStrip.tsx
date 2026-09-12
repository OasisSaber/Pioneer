import {
  useLayoutEffect,
  useRef,
  type Dispatch,
  type KeyboardEvent,
} from 'react';

import type { TabsAction } from '../state/tabs-reducer';
import type { TabsState } from '../../shared/contracts/tabs';

export interface TabStripProps {
  state: TabsState;
  dispatch: Dispatch<TabsAction>;
}

const tabLabel = (tab: TabsState['tabs'][number]): string => {
  if (tab.kind === 'library') return 'Library';
  if (tab.kind === 'settings') return 'Settings';
  return tab.project.name;
};

export function TabStrip({
  state,
  dispatch,
}: TabStripProps): React.JSX.Element {
  const tabElements = useRef(new Map<string, HTMLButtonElement>());
  const restoreFocusAfterClose = useRef(false);

  useLayoutEffect(() => {
    if (!restoreFocusAfterClose.current) return;
    restoreFocusAfterClose.current = false;
    tabElements.current.get(state.activeTabId)?.focus();
  }, [state.activeTabId, state.tabs]);

  const activateAndFocus = (tabId: TabsState['activeTabId']): void => {
    dispatch({ type: 'ACTIVATE_TAB', tabId });
    tabElements.current.get(tabId)?.focus();
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    tabId: TabsState['activeTabId'],
  ): void => {
    const currentIndex = state.tabs.findIndex((tab) => tab.id === tabId);
    if (currentIndex === -1) return;

    let targetIndex: number | undefined;
    if (event.key === 'Home') targetIndex = 0;
    if (event.key === 'End') targetIndex = state.tabs.length - 1;
    if (event.key === 'ArrowLeft') {
      targetIndex = (currentIndex - 1 + state.tabs.length) % state.tabs.length;
    }
    if (event.key === 'ArrowRight') {
      targetIndex = (currentIndex + 1) % state.tabs.length;
    }

    const target =
      targetIndex === undefined ? undefined : state.tabs[targetIndex];
    if (target === undefined) return;
    event.preventDefault();
    activateAndFocus(target.id);
  };

  return (
    <nav aria-label="Workspace sections" className="tab-strip" role="tablist">
      {state.tabs.map((tab) => {
        const label = tabLabel(tab);
        const selected = state.activeTabId === tab.id;
        return (
          <div className="tab-strip__item" key={tab.id} role="presentation">
            <button
              aria-controls={`panel-${tab.id}`}
              aria-selected={selected}
              className="tab-strip__tab"
              id={`tab-${tab.id}`}
              onClick={() => {
                activateAndFocus(tab.id);
              }}
              onKeyDown={(event) => {
                handleTabKeyDown(event, tab.id);
              }}
              ref={(element) => {
                if (element === null) tabElements.current.delete(tab.id);
                else tabElements.current.set(tab.id, element);
              }}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              {label}
            </button>
            {tab.kind === 'project' ? (
              <button
                aria-label={`Close ${label}`}
                className="tab-strip__close"
                onClick={() => {
                  restoreFocusAfterClose.current = selected;
                  dispatch({ type: 'CLOSE_TAB', tabId: tab.id });
                }}
                tabIndex={selected ? 0 : -1}
                type="button"
              >
                ×
              </button>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
