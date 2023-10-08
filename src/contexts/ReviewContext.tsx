import type { MutableRefObject, ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';

import { useFeatureToggle } from '@flopflip/react-broadcast';
import { diffText, DiffType } from '../utils/diffText';
import type { Diff } from '../utils/diffText';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from '../hooks/useRallyApi';
import { useDocument } from './DocumentContext';
import {
  Playbook,
  ReviewScope,
  RevisionType,
} from '../services/RallyApiService';
import { DocumentService } from '../services/DocumentService';
import { useDocumentData } from './DocumentDataContext';
import { isNotNull } from '../utils/functools';
import type { ReviewItem } from '../types/ReviewItem';
import { ReviewLens } from '../types/ReviewLens';
import { useSelection } from '../hooks/useSelection';
import { useAnalytics } from './AnalyticsContext';

export enum ReviewState {
  NotStarted,
  InProgress,
  NoResults,
  HasResults,
  ClearedResults,
}

export type ReviewLensState = {
  lens: ReviewLens;
  scope: ReviewScope;
  instruction?: string;
  includedRevisionTypes?: RevisionType[];
  playbook?: Playbook;
};

type ReviewContextType = {
  reviewItems: ReviewItem[];
  numReviewItemsGenerated: number;
  isReviewLoading: boolean;
  reviewState: ReviewState;
  reviewCancelled: boolean;
  reviewProgress: number;
  isInsertAllLoading: boolean;
  generateReviewItems: (
    lens: ReviewLens,
    scope: ReviewScope,
    instruction?: string,
    includedRevisionTypes?: RevisionType[],
  ) => Promise<void>;
  insertReviewItem: (
    reviewItem: ReviewItem,
    includedRevisionTypes?: RevisionType[],
  ) => Promise<void>;
  insertAll: () => Promise<void>;
  dismissReviewItem: (reviewItem: ReviewItem) => void;
  cancelStream: () => void;
  cancelInsertAllRef: MutableRefObject<boolean>;
  resetReviewState: () => void;
  updateReviewItem: (
    reviewItem: ReviewItem,
    update: Partial<ReviewItem>,
  ) => void;
  reviewLensState: ReviewLensState;
  updateReviewLens: ({
    lens,
    scope,
    instruction,
    includedRevisionTypes,
    playbook,
  }: {
    lens?: ReviewLens;
    scope?: ReviewScope;
    instruction?: string;
    includedRevisionTypes?: RevisionType[];
    playbook?: Playbook;
  }) => void;
  origin?: string;
  activeReviewLens: ReviewLens | null;
  setActiveReviewLens: (activeReviewLens: ReviewLens | null) => void;
};

export const ReviewContext = createContext<ReviewContextType | undefined>(
  undefined,
);

async function applyDiff(
  context: Word.RequestContext,
  selection: Word.Range,
  diff: Diff[],
) {
  let remainingRange = selection.getRange(Word.RangeLocation.whole);
  let prevRange = selection.getRange(Word.RangeLocation.start);
  for (const { diffType, value } of diff) {
    switch (diffType) {
      case DiffType.insert: {
        const currRange = prevRange.insertText(
          value,
          Word.InsertLocation.after,
        );
        prevRange = currRange;
        remainingRange = currRange
          .getRange(Word.RangeLocation.after)
          .expandTo(selection.getRange(Word.RangeLocation.end))
          .intersectWith(selection);
        break;
      }
      case DiffType.delete:
      case DiffType.equal: {
        // eslint-disable-next-line no-await-in-loop
        const currRange = await DocumentService.findFirst(
          context,
          value,
          remainingRange,
          { ignorePunct: false, ignoreSpace: false, trimQuery: false },
        );

        if (currRange) {
          if (diffType === DiffType.delete) {
            currRange.delete();
          }
          prevRange = currRange;
          remainingRange = currRange
            .getRange(Word.RangeLocation.after)
            .expandTo(selection.getRange(Word.RangeLocation.end));
        }
        break;
      }
      default: {
        throw new Error(`Invalid diff type: "${diffType}"`);
      }
    }
  }
}

type ReviewContextProviderProps = { origin: string; children: ReactNode };

export function ReviewContextProvider({
  origin,
  children,
}: ReviewContextProviderProps) {
  const { trackEvent } = useAnalytics();
  const { reviewStream } = useRallyApi();
  const { getDocumentText } = useDocument();
  const { getSelection } = useSelection();
  const {
    documentData: { representedParty },
  } = useDocumentData();
  const [reviewState, setReviewState] = useState(ReviewState.NotStarted);
  const [reviewCancelled, setReviewCancelled] = useState(false);
  const [reviewProgress, setReviewProgress] = useState(0);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [hiddenReviewItems, setHiddenReviewItems] = useState<ReviewItem[]>([]);
  const cancelInsertAllRef = useRef(false);
  const [isInsertAllLoading, setIsInsertAllLoading] = useState(false);
  const streamControllerRef = useRef<AbortController>();
  const [reviewLensState, setReviewLensState] = useState<ReviewLensState>({
    lens: ReviewLens.General,
    scope: ReviewScope.document,
    instruction: '',
    includedRevisionTypes: [RevisionType.modification, RevisionType.comment],
  });
  const [activeReviewLens, setActiveReviewLens] = useState<ReviewLens | null>(
    ReviewLens.General,
  );

  const visibleReviewItems = reviewItems.filter(
    (reviewItem) => !hiddenReviewItems.includes(reviewItem),
  );

  const insertReviewItem = useCallback(
    async (reviewItem: ReviewItem, includedRevisionTypes?: RevisionType[]) => {
      try {
        await Word.run(async (context) => {
          await DocumentService.trackChanges(context, async () => {
            const foundText = await DocumentService.findAndSelect(
              context,
              reviewItem.paragraph,
            );

            if (!foundText) {
              throw new Error("Couldn't find text to change for review item");
            }

            const selection = await DocumentService.getSelection(context);
            if (reviewItem.type === RevisionType.modification) {
              if (reviewItem.diff) {
                if (includedRevisionTypes?.includes(RevisionType.comment)) {
                  selection.insertComment(reviewItem.reason);
                }
                if (
                  includedRevisionTypes?.includes(RevisionType.modification)
                ) {
                  await applyDiff(context, selection, reviewItem.diff);
                }
              } else {
                const replacedRange = await DocumentService.replaceSelection(
                  context,
                  selection,
                  reviewItem.text,
                );
                await DocumentService.selectRange(context, replacedRange);
              }
            }
            if (reviewItem.type === RevisionType.comment) {
              selection.insertComment(reviewItem.text);
            }
            await context.sync();
            setHiddenReviewItems((prevHiddenReviewItems) => [
              ...prevHiddenReviewItems,
              reviewItem,
            ]);
          });
        });
      } catch (error) {
        handleException(error);
      }
    },
    [],
  );

  const insertAll = useCallback(async () => {
    setIsInsertAllLoading(true);
    cancelInsertAllRef.current = false;
    try {
      for (const reviewItem of visibleReviewItems) {
        if (cancelInsertAllRef.current) {
          setIsInsertAllLoading(false);
          break;
        } else {
          // eslint-disable-next-line no-await-in-loop
          await insertReviewItem(reviewItem, [
            RevisionType.comment,
            RevisionType.modification,
          ]);
        }
      }
    } catch (error) {
      handleException(error);
    } finally {
      setIsInsertAllLoading(false);
    }
  }, [insertReviewItem, visibleReviewItems]);

  const cancelStream = useCallback(() => {
    console.log('cancelling review stream');
    streamControllerRef.current?.abort();
    setReviewCancelled(true);
  }, []);

  const isSelectiveReviewEnabled = useFeatureToggle('selectiveReview');

  const generateReviewItems = useCallback(
    async (
      reviewLens: ReviewLens,
      reviewScope: ReviewScope,
      instruction?: string,
      includedRevisionTypes?: RevisionType[],
    ) => {
      let foundResults = false;
      const resultStats = {
        totalItems: 0,
        numDiscarded: 0,
      };
      try {
        if (streamControllerRef.current) {
          streamControllerRef.current.abort();
        }
        setReviewState(ReviewState.InProgress);
        setReviewCancelled(false);
        setReviewProgress(0);
        setReviewItems([]);
        let streamDone = false;

        let documentText = '';
        await Word.run(async (context) => {
          if (
            reviewScope === ReviewScope.selection &&
            isSelectiveReviewEnabled
          ) {
            const { selection } = await getSelection(context);
            documentText = DocumentService.cleanText(selection.text);
          } else {
            documentText = await getDocumentText();
          }
        });

        const controller = new AbortController();
        streamControllerRef.current = controller;
        await reviewStream({
          documentText,
          representedParty,
          reviewLens,
          instruction,
          includedRevisionTypes,
          onReceived: async (result) => {
            if (result?.reviewItems?.length) {
              resultStats.totalItems += result.reviewItems.length;
              const newReviewItems = (
                await Promise.all(
                  result.reviewItems.map(async (item) => {
                    let rangeFound = false;
                    await Word.run(async (context) => {
                      const range = await DocumentService.findFirst(
                        context,
                        item.paragraph,
                      );

                      rangeFound = range != null;
                      if (!rangeFound) {
                        resultStats.numDiscarded += 1;
                      }
                    });

                    return rangeFound ? item : null;
                  }),
                )
              )
                .filter(isNotNull)
                .map((item) => {
                  if (item.type === RevisionType.modification) {
                    return {
                      ...item,
                      diff: diffText(item.paragraph, item.text),
                    };
                  }

                  return item;
                });
              foundResults = foundResults || newReviewItems.length > 0;
              setReviewItems((prevReviewItems) => [
                ...prevReviewItems,
                ...newReviewItems,
              ]);
            }
            streamDone = result.done;
            if (result.progress) {
              setReviewProgress(result.progress);
            }
          },
          onAborted: () => {
            setReviewState(
              foundResults ? ReviewState.HasResults : ReviewState.NoResults,
            );
          },
          abortSignal: controller.signal,
        });

        if (!streamDone && !controller.signal.aborted) {
          throw new Error(
            `Review Incomplete - Stream didn't complete successfully`,
          );
        }
      } catch (error) {
        handleException(error);
      } finally {
        trackEvent('Review Finished', {
          ...resultStats,
          generatedResults: resultStats.totalItems > 0,
          numDisplayed: resultStats.totalItems - resultStats.numDiscarded,
          discardedAll: resultStats.totalItems === resultStats.numDiscarded,
        });
        setTimeout(() => {
          setReviewState(
            foundResults ? ReviewState.HasResults : ReviewState.NoResults,
          );
        }, 300);
      }
    },
    [
      getDocumentText,
      representedParty,
      reviewStream,
      getSelection,
      isSelectiveReviewEnabled,
      trackEvent,
    ],
  );

  useEffect(() => {
    if (
      visibleReviewItems.length === 0 &&
      reviewState === ReviewState.HasResults
    ) {
      setReviewState(ReviewState.ClearedResults);
    }
  }, [reviewState, visibleReviewItems.length]);

  const dismissReviewItem = useCallback(
    (reviewItem) => {
      setHiddenReviewItems([
        ...reviewItems.filter((item) => item.id === reviewItem.id),
        ...hiddenReviewItems,
      ]);
    },
    [hiddenReviewItems, reviewItems],
  );

  const resetReviewState = () => {
    setReviewState(ReviewState.NotStarted);
  };

  const updateReviewItem = useCallback(
    (reviewItem: ReviewItem, update: Partial<ReviewItem>) => {
      setReviewItems((prevReviewItems) => {
        const updatedItems = prevReviewItems.map((item) => {
          if (item.id === reviewItem.id) {
            return { ...item, ...update } as ReviewItem;
          }
          return item;
        });
        return updatedItems;
      });
    },
    [setReviewItems],
  );

  const updateReviewLens = useCallback(
    ({
      lens,
      scope,
      instruction,
      includedRevisionTypes,
      playbook,
    }: {
      lens?: ReviewLens;
      scope?: ReviewScope;
      instruction?: string;
      includedRevisionTypes?: RevisionType[];
      playbook?: Playbook;
    }) => {
      setReviewLensState((prevReviewLensState) => ({
        ...prevReviewLensState,
        lens: lens ?? ReviewLens.General,
        scope: scope ?? ReviewScope.document,
        instruction,
        includedRevisionTypes,
        playbook,
      }));
    },
    [],
  );

  const numReviewItemsGenerated = reviewItems.length;

  const value = useMemo(
    () => ({
      reviewState,
      reviewCancelled,
      numReviewItemsGenerated,
      reviewItems: visibleReviewItems,
      isReviewLoading: reviewState === ReviewState.InProgress,
      reviewProgress,
      isInsertAllLoading,
      generateReviewItems,
      insertReviewItem,
      insertAll,
      dismissReviewItem,
      cancelInsertAllRef,
      cancelStream,
      resetReviewState,
      updateReviewItem,
      reviewLensState,
      updateReviewLens,
      origin,
      activeReviewLens,
      setActiveReviewLens,
    }),
    [
      reviewState,
      reviewCancelled,
      numReviewItemsGenerated,
      visibleReviewItems,
      reviewProgress,
      isInsertAllLoading,
      generateReviewItems,
      insertReviewItem,
      insertAll,
      dismissReviewItem,
      cancelStream,
      updateReviewItem,
      reviewLensState,
      updateReviewLens,
      origin,
      activeReviewLens,
      setActiveReviewLens,
    ],
  );
  return (
    <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
  );
}

export function useReview(): ReviewContextType {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewContextProvider');
  }
  return context;
}
