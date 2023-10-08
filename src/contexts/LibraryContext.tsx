import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  Dispatch,
  SetStateAction,
} from 'react';
import { useRallyApi } from '../hooks/useRallyApi';
import { handleException } from '../utils/ErrorUtils';
import {
  ClauseSearchFieldOption,
  ClauseSearchSortType,
  ClauseSearchResponseItem,
  ClauseSearchSortOrder,
  DocStore,
  DocStoreType,
  DocStoreSync,
} from '../services/RallyApiService';

export type LibraryContextType = {
  clauses: ClauseSearchResponseItem[];
  setClauses: Dispatch<SetStateAction<ClauseSearchResponseItem[]>>;
  docStores: DocStore[];
  fetchDocStores: () => Promise<void>;
  createDocStore: (name: string, type: DocStoreType) => Promise<void>;
  updateDocStore: (id: string, name?: string) => Promise<void>;
  deleteDocStore: (id: string) => Promise<void>;
  isCreatingDocStore: boolean;
  startSync: (id: string) => Promise<DocStoreSync>;
  getSync: (id: string, syncId: string) => Promise<DocStoreSync>;
  cancelSync: (id: string, syncId: string) => Promise<void>;
  isDocStoresLoading: boolean;
  uploadDocStoreFiles: (files: FileList, _id: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  searchClauses: () => Promise<void>;
  hasSearched: boolean;
  setHasSearched: (hasSearched: boolean) => void;
  bookmarkClause: (clauseId: string) => Promise<void>;
  unbookmarkClause: (clauseId: string) => Promise<void>;
  deleteClause: (clauseId: string) => Promise<void>;
  filters: string[];
  setFilters: Dispatch<SetStateAction<string[]>>;
  sortBy: string;
  setSortBy: Dispatch<SetStateAction<ClauseSearchSortType>>;
  isSearchLoading: boolean;
  trackUseClause: (clauseId: string) => Promise<void>;
};

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryContextProvider({ children }: { children: ReactNode }) {
  const [clauses, setClauses] = useState<ClauseSearchResponseItem[]>([]);
  const [docStores, setDocStores] = useState<DocStore[]>([]);
  const [isCreatingDocStore, setIsCreatingDocStore] = useState(false);
  const [isDocStoresLoading, setIsDocStoresLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState(ClauseSearchSortType.NUM_OCCURRENCES);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const {
    getDocStores,
    createDocStoreFiles,
    createDocStore: createDocStoreApi,
    updateDocStore: updateDocStoreApi,
    deleteDocStore: deleteDocStoreApi,
    searchClauses: searchClausesApi,
    startDocStoreSync,
    getDocStoreSync,
    cancelDocStoreSync,
    bookmarkClause: bookmarkClauseApi,
    unbookmarkClause: unbookmarkClauseApi,
    deleteClause: deleteClauseApi,
    trackUseClause: trackUseClauseApi,
  } = useRallyApi();

  const fetchDocStores = useCallback(async () => {
    try {
      setIsDocStoresLoading(true);
      const docStoredata = await getDocStores();
      setDocStores(docStoredata.documentStores);
    } catch (error) {
      handleException(error);
    } finally {
      setIsDocStoresLoading(false);
    }
  }, [getDocStores, setDocStores]);

  const uploadDocStoreFiles = useCallback(
    async (files: FileList, _id: string) => {
      try {
        await createDocStoreFiles(files, _id);
      } catch (error) {
        handleException(error);
      }
    },
    [createDocStoreFiles],
  );

  const createDocStore = useCallback(
    async (name: string, type: DocStoreType) => {
      try {
        setIsCreatingDocStore(true);
        await createDocStoreApi(name, type);
        await fetchDocStores();
      } catch (error) {
        handleException(error);
      } finally {
        setIsCreatingDocStore(false);
      }
    },
    [fetchDocStores, createDocStoreApi],
  );

  const updateDocStore = useCallback(
    async (id: string, name?: string) => {
      try {
        await updateDocStoreApi(id, name);
        await fetchDocStores();
      } catch (error) {
        handleException(error);
      }
    },
    [fetchDocStores, updateDocStoreApi],
  );

  const deleteDocStore = useCallback(
    async (id: string) => {
      try {
        await deleteDocStoreApi(id);
        setDocStores(docStores.filter((docStore) => docStore._id !== id));
      } catch (error) {
        handleException(error);
      }
    },
    [deleteDocStoreApi, docStores],
  );

  const startSync = useCallback(
    async (documentStoreId: string) => {
      let sync;
      try {
        sync = await startDocStoreSync(documentStoreId);
      } catch (error) {
        handleException(error);
      }
      return sync.documentStoreSync;
    },
    [startDocStoreSync],
  );

  const getSync = useCallback(
    async (documentStoreId: string, documentStoreSyncId: string) => {
      let sync;
      try {
        sync = await getDocStoreSync(documentStoreId, documentStoreSyncId);
      } catch (error) {
        handleException(error);
      }
      return sync.documentStoreSync;
    },
    [getDocStoreSync],
  );

  const cancelSync = useCallback(
    async (documentStoreId: string, documentStoreSyncId: string) => {
      try {
        await cancelDocStoreSync(documentStoreId, documentStoreSyncId);
      } catch (error) {
        handleException(error);
      }
    },
    [cancelDocStoreSync],
  );

  const initalized = useRef(false);
  useEffect(() => {
    if (!initalized.current) {
      fetchDocStores();
      initalized.current = true;
    }
  }, [fetchDocStores]);

  const searchClauses = useCallback(async () => {
    try {
      setIsSearchLoading(true);
      const filter = {
        docStoreIds: filters ?? [],
        documentIds: [],
      };
      const similarityQuery = {
        query: searchQuery,
        field: ClauseSearchFieldOption.TITLE,
      };
      const clauseData = await searchClausesApi(similarityQuery, filter, {
        order: ClauseSearchSortOrder.DESC,
        type: sortBy,
      });
      setClauses(clauseData.clauses);
    } catch (error) {
      handleException(error);
    } finally {
      setIsSearchLoading(false);
      setHasSearched(true);
    }
  }, [filters, searchClausesApi, searchQuery, sortBy]);

  const bookmarkClause = useCallback(
    async (clauseId: string) => {
      try {
        await bookmarkClauseApi(clauseId);
      } catch (error) {
        handleException(error);
      }
    },
    [bookmarkClauseApi],
  );

  const unbookmarkClause = useCallback(
    async (clauseId: string) => {
      try {
        await unbookmarkClauseApi(clauseId);
      } catch (error) {
        handleException(error);
      }
    },
    [unbookmarkClauseApi],
  );

  const deleteClause = useCallback(
    async (clauseId: string) => {
      try {
        await deleteClauseApi(clauseId);
      } catch (error) {
        handleException(error);
      }
    },
    [deleteClauseApi],
  );

  const trackUseClause = useCallback(
    async (clauseId: string) => {
      try {
        await trackUseClauseApi(clauseId);
      } catch (error) {
        handleException(error);
      }
    },
    [trackUseClauseApi],
  );

  const value = useMemo(
    () => ({
      clauses,
      setClauses,
      docStores,
      fetchDocStores,
      createDocStore,
      updateDocStore,
      deleteDocStore,
      isCreatingDocStore,
      startSync,
      getSync,
      cancelSync,
      isDocStoresLoading,
      uploadDocStoreFiles,
      searchQuery,
      setSearchQuery,
      hasSearched,
      setHasSearched,
      searchClauses,
      bookmarkClause,
      unbookmarkClause,
      deleteClause,
      filters,
      setFilters,
      sortBy,
      setSortBy,
      isSearchLoading,
      trackUseClause,
    }),

    [
      clauses,
      docStores,
      fetchDocStores,
      createDocStore,
      updateDocStore,
      deleteDocStore,
      isCreatingDocStore,
      startSync,
      getSync,
      cancelSync,
      isDocStoresLoading,
      uploadDocStoreFiles,
      searchQuery,
      hasSearched,
      setHasSearched,
      searchClauses,
      bookmarkClause,
      unbookmarkClause,
      deleteClause,
      filters,
      sortBy,
      isSearchLoading,
      trackUseClause,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextType {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryContextProvider');
  }
  return context;
}
