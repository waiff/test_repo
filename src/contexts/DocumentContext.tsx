import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  createContext,
  useContext,
} from 'react';

import { DocumentService } from '../services/DocumentService';

type SelectionChangedHandler = () => Promise<void> | void;

type DocumentContextType = {
  addSelectionChangedHandler: (handler: SelectionChangedHandler) => () => void;
  hasSelection: boolean;
  refreshDocumentState: () => void;
  getDocumentText: () => Promise<string>;
  selectText: (text: string) => Promise<void>;
  isLongDoc: boolean;
};

export const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined,
);

type DocumentProviderState = {
  selectionChangedHandlers: any[];
  hasSelection: boolean;
  isLongDoc: boolean;
};

enum DocumentProviderActionType {
  AddSelectionChangedHandler = 'add_selection_changed_handler',
  RemoveSelectionChangedHandler = 'remove_selection_changed_handler',
  UpdateDocumentState = 'updateDocumentState',
}

export type DocumentProviderAction =
  | {
      type: DocumentProviderActionType.AddSelectionChangedHandler;
      handler: any;
    }
  | {
      type: DocumentProviderActionType.RemoveSelectionChangedHandler;
      handler: any;
    }
  | {
      type: DocumentProviderActionType.UpdateDocumentState;
      hasSelection: boolean;
      isLongDoc: boolean;
    };

function reducer(
  state: DocumentProviderState,
  action: DocumentProviderAction,
): DocumentProviderState {
  switch (action.type) {
    case DocumentProviderActionType.AddSelectionChangedHandler: {
      console.log('adding selection changed handler');
      return {
        ...state,
        selectionChangedHandlers: [
          ...state.selectionChangedHandlers,
          action.handler,
        ],
      };
    }
    case DocumentProviderActionType.RemoveSelectionChangedHandler: {
      console.log('removed selection changed handler');
      return {
        ...state,
        selectionChangedHandlers: state.selectionChangedHandlers.filter(
          (handler) => handler !== action.handler,
        ),
      };
    }
    case DocumentProviderActionType.UpdateDocumentState: {
      return {
        ...state,
        hasSelection: action.hasSelection,
        isLongDoc: action.isLongDoc,
      };
    }
    default: {
      console.log('unknown event for document provider reducer');
      return state;
    }
  }
}

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [{ selectionChangedHandlers, hasSelection, isLongDoc }, dispatch] =
    useReducer(reducer, {
      selectionChangedHandlers: [],
      hasSelection: false,
      isLongDoc: false,
    });

  const addSelectionChangedHandler = useCallback(
    (handler: SelectionChangedHandler) => {
      dispatch({
        type: DocumentProviderActionType.AddSelectionChangedHandler,
        handler,
      });
      return () =>
        dispatch({
          type: DocumentProviderActionType.RemoveSelectionChangedHandler,
          handler,
        });
    },
    [],
  );

  const refreshDocumentState = useCallback(() => {
    Word.run(async (context: Word.RequestContext) => {
      const selection = await DocumentService.getSelection(context);
      const selectionText = DocumentService.cleanText(selection.text);
      const longDoc = await DocumentService.isLongDocument(context);
      dispatch({
        type: DocumentProviderActionType.UpdateDocumentState,
        hasSelection: !!selectionText,
        isLongDoc: longDoc,
      });
    });
  }, []);

  const getDocumentText = useCallback(async () => {
    let text = '';
    await Word.run(async (context: Word.RequestContext) => {
      const document = await DocumentService.getDocumentText(context);
      text = document;
    });
    return text;
  }, []);

  const selectText = useCallback(async (text: string) => {
    await Word.run(async (context) => {
      if (!text) {
        return;
      }

      await DocumentService.findAndSelect(context, text);
    });
  }, []);

  useEffect(() => {
    function runAllHandlers() {
      return Promise.all(selectionChangedHandlers.map((handler) => handler()));
    }
    return DocumentService.addSelectionChangedHandler(runAllHandlers);
  }, [selectionChangedHandlers]);

  useEffect(() => {
    refreshDocumentState();
    return addSelectionChangedHandler(refreshDocumentState);
  }, [refreshDocumentState, addSelectionChangedHandler]);

  const value = useMemo(
    () => ({
      addSelectionChangedHandler,
      hasSelection,
      refreshDocumentState,
      getDocumentText,
      selectText,
      isLongDoc,
    }),
    [
      addSelectionChangedHandler,
      hasSelection,
      refreshDocumentState,
      getDocumentText,
      selectText,
      isLongDoc,
    ],
  );

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument(): DocumentContextType {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
