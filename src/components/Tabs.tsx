import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { useParams } from 'react-router-dom';

export enum Tabs {
  Assistant = 'Assistant',
  Insights = 'Insights',
  Review = 'Review',
  Draft = 'Draft',
  Library = 'Library',
}

enum ActionType {
  MarkUnread = 'mark_unread',
  MarkRead = 'mark_read',
}

type ReducerAction = {
  type: ActionType;
  tab: Tabs;
};

const getTabEnum = (tab: string) => {
  switch (tab) {
    case 'assistant':
      return Tabs.Assistant;
    case 'insights':
      return Tabs.Insights;
    case 'review':
      return Tabs.Review;
    case 'draft':
      return Tabs.Draft;
    case 'library':
      return Tabs.Library;
    default:
      throw new Error(`unknown tab: ${tab}`);
  }
};

function reducer(state: Set<Tabs>, action: ReducerAction) {
  const newState = new Set(state);
  switch (action.type) {
    case ActionType.MarkUnread:
      if (!newState.has(action.tab)) {
        newState.add(action.tab);
      }
      break;
    case ActionType.MarkRead:
      if (newState.has(action.tab)) {
        newState.delete(action.tab);
      }
      break;
    default:
      throw new Error(`unknown action type`);
  }
  return newState;
}

type TabContextType = {
  isUnread: (tab: Tabs) => boolean;
  markUnread: (tab: Tabs) => void;
};

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabContextProvider({ children }: { children: ReactNode }) {
  const [unreadTabs, dispatch] = useReducer(reducer, new Set<Tabs>());
  const { tab: tabParam } = useParams();

  const isUnread = useCallback(
    (tab: Tabs) => unreadTabs.has(tab),
    [unreadTabs],
  );
  const markRead = useCallback(
    (tab: Tabs) => dispatch({ type: ActionType.MarkRead, tab }),
    [],
  );
  const markUnread = useCallback((tab: Tabs) => {
    dispatch({ type: ActionType.MarkUnread, tab });
  }, []);

  useEffect(() => {
    if (tabParam) {
      const activeTab = getTabEnum(tabParam);
      if (unreadTabs.has(activeTab)) markRead(activeTab);
    }
  }, [markRead, tabParam, unreadTabs]);

  const value = useMemo(
    () => ({
      isUnread,
      markUnread,
    }),
    [markUnread, isUnread],
  );

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

export function useTabs() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabs must be used within a TabContextProvider');
  }
  return context;
}
