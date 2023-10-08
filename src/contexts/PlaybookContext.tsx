import {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import { Playbook } from '../services/RallyApiService';
import { useRallyApi } from '../hooks/useRallyApi';
import { handleException } from '../utils/ErrorUtils';

export type PlaybookContextType = {
  playbooks: Playbook[];
  fetchPlaybooks: () => Promise<void>;
  createPlaybook: (title: string, instruction: string) => Promise<void>;
  updatePlaybook: (
    id: string,
    title?: string,
    instruction?: string,
  ) => Promise<void>;
  deletePlaybook: (id: string) => Promise<void>;
  isPlaybooksLoading: boolean;
  isCreatingPlaybook: boolean;
  isPlaybookDrawerOpen: boolean;
  setIsPlaybookDrawerOpen: (isPlaybookDrawerOpen: boolean) => void;
};

export const PlaybookContext = createContext<PlaybookContextType | undefined>(
  undefined,
);

export function PlaybookContextProvider({ children }: { children: ReactNode }) {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [isPlaybooksLoading, setIsPlaybooksLoading] = useState(false);
  const [isCreatingPlaybook, setIsCreatingPlaybook] = useState(false);
  const [isPlaybookDrawerOpen, setIsPlaybookDrawerOpen] = useState(false);
  const {
    getPlaybooks,
    createPlaybook: createPlaybookApi,
    updatePlaybook: updatePlaybookApi,
    deletePlaybook: deletePlaybookApi,
  } = useRallyApi();

  const fetchPlaybooks = useCallback(async () => {
    try {
      setIsPlaybooksLoading(true);
      const playbookData = await getPlaybooks();
      setPlaybooks(playbookData.playbooks);
    } catch (error) {
      handleException(error);
    } finally {
      setIsPlaybooksLoading(false);
    }
  }, [getPlaybooks, setPlaybooks]);

  const createPlaybook = useCallback(
    async (title: string, instruction: string) => {
      try {
        setIsCreatingPlaybook(true);
        await createPlaybookApi(title, instruction);
        await fetchPlaybooks();
      } catch (error) {
        handleException(error);
      } finally {
        setIsCreatingPlaybook(false);
      }
    },
    [createPlaybookApi, fetchPlaybooks],
  );

  const updatePlaybook = useCallback(
    async (id: string, title?: string, instruction?: string) => {
      try {
        await updatePlaybookApi(id, title, instruction);
        fetchPlaybooks();
      } catch (error) {
        handleException(error);
      }
    },
    [fetchPlaybooks, updatePlaybookApi],
  );

  const deletePlaybook = useCallback(
    async (id: string) => {
      try {
        await deletePlaybookApi(id);
        setPlaybooks(playbooks.filter((playbook) => playbook._id !== id));
      } catch (error) {
        handleException(error);
      }
    },
    [playbooks, deletePlaybookApi],
  );

  const value = useMemo(
    () => ({
      playbooks,
      fetchPlaybooks,
      createPlaybook,
      updatePlaybook,
      deletePlaybook,
      isPlaybooksLoading,
      isCreatingPlaybook,
      isPlaybookDrawerOpen,
      setIsPlaybookDrawerOpen,
    }),
    [
      createPlaybook,
      deletePlaybook,
      fetchPlaybooks,
      isPlaybooksLoading,
      playbooks,
      updatePlaybook,
      isCreatingPlaybook,
      isPlaybookDrawerOpen,
    ],
  );

  return (
    <PlaybookContext.Provider value={value}>
      {children}
    </PlaybookContext.Provider>
  );
}

export function usePlaybook(): PlaybookContextType {
  const context = useContext(PlaybookContext);
  if (context === undefined) {
    throw new Error('usePlaybook must be used within a ReviewContextProvider');
  }
  return context;
}
