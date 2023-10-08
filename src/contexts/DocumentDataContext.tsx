import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import { v4 } from 'uuid';
import type { TermSummary } from '../services/RallyApiService';
import { useEmbeddings } from '../hooks/useEmbeddings';
import { useExplanation } from '../hooks/useExplanation';
import { useRallyApi } from '../hooks/useRallyApi';
import { handleException } from '../utils/ErrorUtils';
import { useAuthentication } from './AuthenticationContext';
import { useDocument } from './DocumentContext';
import { Party } from '../types/Party';

export type UpdateDocumentData = (newDocumentData: DocumentData) => void;

export type DocumentData = {
  classification?: string;
  detailedTerms?: TermSummary[] | null;
  nextDetailedTerms?: Promise<TermSummary[]> | null;
  explanation?: string;
  parties?: Party[];
  representedParty?: Party;
};

export type DocumentDataStatus = {
  partiesLoading: boolean;
  isTermsLoading: boolean;
  isTermsError: boolean;
  isDocumentEmpty: boolean;
};

type CachedDocumentData = Pick<DocumentData, 'representedParty'>;

export const DocumentDataContext = createContext<
  | {
      updateDocumentData: UpdateDocumentData;
      documentData: DocumentData;
      status: DocumentDataStatus;
      refreshDocumentText: () => Promise<void>;
    }
  | undefined
>(undefined);

export type DocumentDataReducerAction = {
  type: 'update';
  newDocumentData: DocumentData;
};

function getDocumentId() {
  const documentId = Office.context.document.settings.get('documentId') as
    | string
    | undefined;

  if (!documentId) {
    const newDocumentId = v4();
    Office.context.document.settings.set('documentId', newDocumentId);
    Office.context.document.settings.saveAsync();
    return newDocumentId;
  }

  return documentId;
}

function getDocumentDataContextKey(): string {
  return `${getDocumentId()}.spellbook.documentDataContext`;
}

function loadContextFromLocalStorage(): CachedDocumentData {
  return JSON.parse(localStorage.getItem(getDocumentDataContextKey()) ?? '{}');
}

function saveContextToLocalStorage({
  representedParty,
}: CachedDocumentData): void {
  localStorage.setItem(
    getDocumentDataContextKey(),
    JSON.stringify({ representedParty }),
  );
}

function reducer(
  state: DocumentData,
  action: DocumentDataReducerAction,
): DocumentData {
  switch (action.type) {
    case 'update': {
      const newState = { ...state, ...action.newDocumentData };
      saveContextToLocalStorage(newState);
      return newState;
    }
    default: {
      throw new Error(`unknown document data action: ${action.type}`);
    }
  }
}

function initializeDocumentData(): DocumentData {
  const { representedParty } = loadContextFromLocalStorage();

  return {
    classification: undefined,
    detailedTerms: undefined,
    nextDetailedTerms: undefined,
    explanation: undefined,
    parties: undefined,
    representedParty,
  };
}

export function DocumentDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthentication();
  const { classifyDocument, termSummary, listParties } = useRallyApi();
  const getExplanation = useExplanation();
  useEmbeddings();
  const [documentText, setDocumentText] = useState<string>();
  const [partiesLoading, setPartiesLoading] = useState<boolean>(false);
  const [isTermsLoading, setIsTermsLoading] = useState<boolean>(true);
  const [isTermsError, setIsTermsError] = useState<boolean>(false);
  const { getDocumentText } = useDocument();
  const [documentData, dispatch] = useReducer(
    reducer,
    null,
    initializeDocumentData,
  );

  const {
    classification,
    detailedTerms,
    nextDetailedTerms,
    explanation,
    parties,
  } = documentData;

  const updateDocumentData = useCallback(
    (newDocumentData: DocumentData) =>
      dispatch({ type: 'update', newDocumentData }),
    [],
  );

  useEffect(() => {
    const loadDocumentData = async () => {
      if (!isAuthenticated) {
        return;
      }
      const docText = await getDocumentText();
      if (!docText) {
        setIsTermsLoading(false);
      }
      setDocumentText(docText);
    };

    loadDocumentData()
      .then(() => console.log('loaded document data'))
      .catch((error) => handleException(error));
  }, [isAuthenticated, setDocumentText, getDocumentText]);

  useEffect(() => {
    const updateClassification = async () => {
      if (documentText && !classification) {
        updateDocumentData({
          classification: await classifyDocument(documentText),
        });
      }
    };
    updateClassification().catch((error) => handleException(error));
  }, [documentText, classification, classifyDocument, updateDocumentData]);

  useEffect(() => {
    async function loadNextDetailedTerms() {
      if (classification && !nextDetailedTerms) {
        const document = await getDocumentText();
        updateDocumentData({
          nextDetailedTerms: (async () =>
            (await termSummary(document, classification)).terms)(),
        });
      }
    }

    loadNextDetailedTerms().catch((error) => handleException(error));
  }, [
    classification,
    nextDetailedTerms,
    termSummary,
    updateDocumentData,
    getDocumentText,
  ]);

  useEffect(() => {
    const updateDetailedTerms = async () => {
      if (documentText && nextDetailedTerms && !detailedTerms) {
        setIsTermsError(false);
        try {
          console.log('loading term summary');
          setIsTermsLoading(true);
          const documentTerms = await nextDetailedTerms;
          updateDocumentData({ detailedTerms: documentTerms });
        } catch (error) {
          setIsTermsError(true);
          handleException(error);
        } finally {
          setIsTermsLoading(false);
        }
      }
    };
    updateDetailedTerms().catch((error) => handleException(error));
  }, [
    documentText,
    classification,
    nextDetailedTerms,
    detailedTerms,
    updateDocumentData,
  ]);

  useEffect(() => {
    const updateExplanation = async () => {
      if (documentText && !explanation) {
        updateDocumentData({ explanation: await getExplanation(documentText) });
      }
    };
    updateExplanation().catch((error) => handleException(error));
  }, [documentText, explanation, getExplanation, updateDocumentData]);

  useEffect(() => {
    const updateParties = async () => {
      if (documentText && !parties) {
        try {
          setPartiesLoading(true);
          const documentParties = await listParties(documentText);
          updateDocumentData({
            parties: documentParties?.parties ?? [],
          });
        } finally {
          setPartiesLoading(false);
        }
      }
    };
    updateParties().catch((error) => handleException(error));
  }, [documentText, listParties, parties, updateDocumentData]);

  const refreshDocumentText = useCallback(async () => {
    const text = await getDocumentText();
    setDocumentText(text);
  }, [getDocumentText]);

  const value = useMemo(
    () => ({
      documentData,
      updateDocumentData,
      status: {
        partiesLoading,
        isTermsLoading,
        isTermsError,
        isDocumentEmpty: !documentText,
      },
      refreshDocumentText,
    }),
    [
      documentData,
      updateDocumentData,
      partiesLoading,
      isTermsLoading,
      isTermsError,
      documentText,
      refreshDocumentText,
    ],
  );

  return (
    <DocumentDataContext.Provider value={value}>
      {children}
    </DocumentDataContext.Provider>
  );
}

export function useDocumentData(): {
  documentData: DocumentData;
  updateDocumentData: UpdateDocumentData;
  status: DocumentDataStatus;
  refreshDocumentText: () => Promise<void>;
} {
  const context = useContext(DocumentDataContext);
  if (context === undefined) {
    throw new Error(
      'useDocumentData must be used within a DocumentDataProvider',
    );
  }
  const { documentData, updateDocumentData, status, refreshDocumentText } =
    context;
  return { documentData, updateDocumentData, status, refreshDocumentText };
}
