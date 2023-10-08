import {
  createContext,
  Dispatch,
  ReactNode,
  Reducer,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  useEffect,
  useRef,
} from 'react';
import { PubSub } from 'use-pubsub-js';
import { toast } from 'react-toastify';
import { v4 } from 'uuid';
import { CarouselProvider } from 'pure-react-carousel';
import axios from 'axios';
import { DraftResult, SpellAccepts } from '../services/RallyApiService';
import { useRallyApi } from '../hooks/useRallyApi';
import { DraftEvents } from '../common/DraftEvents';
import { handleException } from '../utils/ErrorUtils';
import { useCastTargets } from '../hooks/useCastTargets';

export enum DraftActionEnum {
  INSERT,
  INSERT_MANY,
  EDIT,
  PIN,
  UNPIN,
  DISMISS,
  REMOVE,
  REMOVE_UNPINNED,
  RESET,
  RESUME,
}

export type DraftCompletionState = { drafts: DraftResult[] };

export type UpdateDraftAction =
  | DraftActionEnum.EDIT
  | DraftActionEnum.PIN
  | DraftActionEnum.UNPIN
  | DraftActionEnum.RESUME;

export type DraftAction =
  | {
      type:
        | UpdateDraftAction
        | DraftActionEnum.DISMISS
        | DraftActionEnum.REMOVE
        | DraftActionEnum.INSERT;
      draft: DraftResult;
    }
  | { type: DraftActionEnum.INSERT_MANY; multipleDrafts: DraftResult[] }
  | { type: DraftActionEnum.REMOVE_UNPINNED | DraftActionEnum.RESET };

const draftReducer: Reducer<DraftCompletionState, DraftAction> = (
  { drafts },
  action,
) => {
  const sanitizedDrafts = drafts.filter((draft) => !draft.placeholder); // remove placeholders
  switch (action.type) {
    case DraftActionEnum.INSERT: {
      return { drafts: [...sanitizedDrafts, action.draft] };
    }
    case DraftActionEnum.INSERT_MANY: {
      const deduplicatedDrafts =
        action.multipleDrafts.filter(
          (scribeResult, index, array) =>
            array.findIndex(
              (result) =>
                result.completion?.trim() === scribeResult.completion?.trim(),
            ) === index ||
            !sanitizedDrafts.some(
              (draft) => draft.completion === scribeResult.completion,
            ),
        ) ?? [];

      return {
        drafts: [...sanitizedDrafts, ...deduplicatedDrafts],
      };
    }
    case DraftActionEnum.EDIT:
    case DraftActionEnum.RESUME:
    case DraftActionEnum.PIN:
    case DraftActionEnum.UNPIN: {
      return {
        drafts: sanitizedDrafts.map((draft) =>
          draft.id === action.draft.id ? action.draft : draft,
        ),
      };
    }
    case DraftActionEnum.DISMISS: {
      return {
        drafts: sanitizedDrafts.map((draft) => {
          if (draft.id === action.draft.id) {
            return { ...draft, dismissed: true };
          }
          return draft;
        }),
      };
    }
    case DraftActionEnum.REMOVE: {
      return {
        drafts: sanitizedDrafts.filter((draft) => draft.id !== action.draft.id),
      };
    }
    case DraftActionEnum.REMOVE_UNPINNED: {
      return {
        drafts: sanitizedDrafts.filter((draft) => !!draft.pinned),
      };
    }
    case DraftActionEnum.RESET: {
      return {
        drafts: [],
      };
    }
    default: {
      return { drafts };
    }
  }
};

export type DraftContextType = {
  draft: (instruction: string) => Promise<void>;
  draftMore: (instruction: string) => Promise<void>;
  drafts: DraftResult[];
  isDraftLoading: boolean;
  insertDraft: (draft: DraftResult) => void;
  updateDraft: (type: UpdateDraftAction, draft: DraftResult) => void;
  removeDraft: (draft: DraftResult) => void;
  dismissDraft: (draft: DraftResult) => void;
  removeUnpinnedDrafts: () => void;
  draftInstructions: string;
  setDraftInstructions: Dispatch<SetStateAction<string>>;
};

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export function DraftContextProvider({ children }: { children: ReactNode }) {
  const { getTargets } = useCastTargets();

  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [draftInstructions, setDraftInstructions] = useState('');
  const { draft: improvedDraft } = useRallyApi();
  const [{ drafts }, draftDispatch] = useReducer(draftReducer, {
    drafts: [],
  });
  const draftControllerRef = useRef<AbortController>();

  const insertDraft = useCallback(
    (draft: DraftResult) => {
      PubSub.publishSync(DraftEvents.DraftInserted, { draft });
      return draftDispatch({
        type: DraftActionEnum.INSERT,
        draft,
      });
    },
    [draftDispatch],
  );

  const insertManyDrafts = useCallback(
    (multipleDrafts: DraftResult[]) => {
      PubSub.publishSync(DraftEvents.DraftsInserted, {
        drafts: multipleDrafts,
      });
      return draftDispatch({
        type: DraftActionEnum.INSERT_MANY,
        multipleDrafts,
      });
    },
    [draftDispatch],
  );

  const updateDraft = useCallback(
    (type: UpdateDraftAction, draft: DraftResult) => {
      PubSub.publishSync(DraftEvents.DraftUpdated, { draft });
      return draftDispatch({
        type,
        draft,
      });
    },
    [draftDispatch],
  );

  const dismissDraft = useCallback(
    (draft: DraftResult) =>
      draftDispatch({
        type: DraftActionEnum.DISMISS,
        draft,
      }),
    [draftDispatch],
  );

  const removeDraft = useCallback(
    (draft: DraftResult) => {
      PubSub.publishSync(DraftEvents.DraftRemoved, { draft });
      return draftDispatch({
        type: DraftActionEnum.REMOVE,
        draft,
      });
    },
    [draftDispatch],
  );

  const removeUnpinnedDrafts = useCallback(
    () =>
      draftDispatch({
        type: DraftActionEnum.REMOVE_UNPINNED,
      }),
    [draftDispatch],
  );

  useEffect(
    () => () => {
      if (draftControllerRef.current) {
        draftControllerRef.current.abort();
      }
    },
    [],
  );

  const draft = useCallback(
    async (instruction: string) => {
      let draftResults: DraftResult[];
      if (draftControllerRef.current) {
        draftControllerRef.current.abort();
      }

      const controller = new AbortController();
      draftControllerRef.current = controller;
      const { signal } = controller;

      await Word.run(async (context) => {
        try {
          setIsDraftLoading(true);
          removeUnpinnedDrafts();

          const loadingPlaceholderDraft = {
            completion: '',
            finished: true,
            id: v4(),
            loading: true,
          };
          insertDraft(loadingPlaceholderDraft);

          const documentData = Object.fromEntries(
            Object.entries(
              await getTargets(context, [
                SpellAccepts.full,
                SpellAccepts.representedParty,
              ]),
            ).map(([key, value]) => [key, value.text]),
          );

          draftResults = await Promise.all([
            improvedDraft(instruction, documentData, signal),
            improvedDraft(instruction, documentData, signal),
          ]);

          draftResults = draftResults.map((draftResult) => ({
            ...draftResult,
            id: v4(),
          }));

          if (!signal.aborted) {
            if (!draftResults.length) {
              updateDraft(DraftActionEnum.EDIT, {
                ...loadingPlaceholderDraft,
                loading: false,
                placeholder: true,
                id: v4(),
              });
            } else {
              removeDraft(loadingPlaceholderDraft);
              insertManyDrafts(draftResults);
            }
          }
        } catch (error: any) {
          if (!axios.isCancel(error)) {
            toast.error(
              'Sorry, something went wrong.\nPlease wait a few seconds and try again.',
            );
            handleException(error);
            removeUnpinnedDrafts();
          }
        } finally {
          if (!signal.aborted) {
            setIsDraftLoading(false);
            draftControllerRef.current = undefined;
          }
        }
      });
    },
    [
      removeUnpinnedDrafts,
      getTargets,
      insertDraft,
      improvedDraft,
      removeDraft,
      updateDraft,
      insertManyDrafts,
    ],
  );

  const draftMore = useCallback(
    async (instruction: string) => {
      await Word.run(async (context) => {
        try {
          const id = v4();
          insertDraft({
            completion: '',
            finished: true,
            id,
            loading: true,
          });

          const documentData = Object.fromEntries(
            Object.entries(
              await getTargets(context, [
                SpellAccepts.full,
                SpellAccepts.termSummary,
                SpellAccepts.classification,
              ]),
            ).map(([key, value]) => [key, value.text]),
          );

          const draftResult = await improvedDraft(instruction, documentData);
          if (!draftResult.completion?.trim()) {
            updateDraft(DraftActionEnum.EDIT, {
              ...draftResult,
              id,
              loading: false,
              placeholder: true,
            });
          } else {
            updateDraft(DraftActionEnum.EDIT, {
              ...draftResult,
              id,
              loading: false,
            });
          }
        } catch (error) {
          toast.error(
            'Sorry, something went wrong.\nPlease wait a few seconds and try again.',
          );
          handleException(error);
        }
      });
    },
    [getTargets, improvedDraft, insertDraft, updateDraft],
  );

  const value = useMemo(
    () => ({
      draft,
      draftMore,
      drafts,
      isDraftLoading,
      insertDraft,
      updateDraft,
      removeDraft,
      dismissDraft,
      removeUnpinnedDrafts,
      draftInstructions,
      setDraftInstructions,
    }),
    [
      dismissDraft,
      draft,
      draftInstructions,
      draftMore,
      drafts,
      insertDraft,
      isDraftLoading,
      removeDraft,
      removeUnpinnedDrafts,
      updateDraft,
    ],
  );

  return (
    <DraftContext.Provider value={value}>
      <CarouselProvider
        naturalSlideWidth={100}
        naturalSlideHeight={300}
        isIntrinsicHeight
        totalSlides={drafts.length}
        dragEnabled={false}
        disableKeyboard
        className="h-full overflow-y-hidden"
      >
        {children}
      </CarouselProvider>
    </DraftContext.Provider>
  );
}

export function useDraft(): DraftContextType {
  const context = useContext(DraftContext);
  if (context === undefined) {
    throw new Error('useDraft must be used within a DraftContextProvider');
  }
  return context;
}
