import { faAngleRight } from '@fortawesome/sharp-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ReactNode, useCallback, useEffect, useReducer } from 'react';

enum ActionType {
  Initialize = 'initialize',
  Expand = 'expand',
  Collapse = 'collapse',
  Toggle = 'toggle',
  ExpandAll = 'expand_all',
  CollapseAll = 'collapse_all',
  Remove = 'remove',
}

type ReducerAction =
  | {
      type: ActionType.Initialize;
      keys: string[];
    }
  | {
      type: ActionType.Expand;
      key: string;
    }
  | {
      type: ActionType.Collapse;
      key: string;
    }
  | {
      type: ActionType.Toggle;
      key: string;
    }
  | {
      type: ActionType.Remove;
      key: string;
    }
  | {
      type: ActionType.ExpandAll;
    }
  | {
      type: ActionType.CollapseAll;
    };

function reducer(state: Record<string, boolean>, action: ReducerAction) {
  switch (action.type) {
    case ActionType.Initialize: {
      return Object.fromEntries(action.keys.map((key) => [key, false]));
    }
    case ActionType.Expand: {
      return { ...state, ...{ [action.key]: true } };
    }
    case ActionType.Toggle: {
      return { ...state, ...{ [action.key]: !state[action.key] } };
    }
    case ActionType.Remove: {
      const newState = { ...state };
      delete newState[action.key];
      return newState;
    }
    case ActionType.ExpandAll: {
      return Object.fromEntries(Object.keys(state).map((key) => [key, true]));
    }
    case ActionType.CollapseAll: {
      return Object.fromEntries(Object.keys(state).map((key) => [key, false]));
    }
    default: {
      throw new Error(`unknown expandable item list action`);
    }
  }
}

export function useExpandableItemList(keys: string[]) {
  const [expanded, dispatch] = useReducer(
    reducer,
    Object.fromEntries(keys.map((key) => [key, false])),
  );

  useEffect(() => {
    dispatch({ type: ActionType.Initialize, keys });
  }, [keys]);

  const expand = useCallback((key: string) => {
    dispatch({ type: ActionType.Expand, key });
  }, []);

  const collapse = useCallback((key: string) => {
    dispatch({ type: ActionType.Expand, key });
  }, []);

  const toggle = useCallback((key: string) => {
    dispatch({ type: ActionType.Toggle, key });
  }, []);

  const remove = useCallback((key: string) => {
    dispatch({ type: ActionType.Remove, key });
  }, []);

  const expandAll = useCallback(() => {
    dispatch({ type: ActionType.ExpandAll });
  }, []);

  const collapseAll = useCallback(() => {
    dispatch({ type: ActionType.CollapseAll });
  }, []);

  const isExpanded = (key: string) => !!expanded[key];

  const isAllExpanded = Object.values(expanded).every((value) => value);
  const isAllCollapsed = Object.values(expanded).every((value) => !value);

  return {
    expand,
    collapse,
    toggle,
    remove,
    expandAll,
    collapseAll,
    isExpanded,
    isAllExpanded,
    isAllCollapsed,
  };
}

type ExpandableItemProps = {
  title: string;
  title2?: string;
  description?: string;
  actions?: ReactNode;
  expanded: boolean;
  toggle: () => void;
  colorClass?: string;
};

export function ExpandableItem({
  title,
  title2,
  description,
  actions,
  expanded,
  toggle,
  colorClass,
}: ExpandableItemProps) {
  return (
    <div className="mb-1 last:mb-0">
      <div
        className={`group flex gap-2 rounded-[8px]  px-2 py-[6px] text-sm font-medium ${
          colorClass ?? 'bg-gray-6'
        }`}
      >
        <button type="button" role="row" className="flex" onClick={toggle}>
          <FontAwesomeIcon
            className={`mr-3 mt-[3px] ${expanded ? '-rotate-90' : ''}`}
            icon={faAngleRight}
          />
          <div className="text-left">
            <span className="font-semibold">
              {title}
              {title2 ? ': ' : ''}
            </span>
            {!!title2 && <span className="font-normal">{title2}</span>}
          </div>
        </button>
        {!!actions && (
          <div className="invisible ml-auto group-hover:visible">{actions}</div>
        )}
      </div>
      {expanded && !!description && (
        <div className="ml-2 mt-[6px] border-l border-gray-4 pl-4 pr-1 text-sm">
          {description}
        </div>
      )}
    </div>
  );
}
