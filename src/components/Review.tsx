import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/sharp-regular-svg-icons';
import { faBookmark as faBookmarkSolid } from '@fortawesome/free-solid-svg-icons';
import { faBookmark } from '@fortawesome/pro-regular-svg-icons';
import { faArrowsRotate } from '@fortawesome/sharp-solid-svg-icons';
import { useDebouncedCallback } from 'use-debounce';
import { useCallback, useState } from 'react';
import { useFeatureToggle } from '@flopflip/react-broadcast';

import { useSpellbook } from '../contexts/SpellbookContext';
import { ReviewItems } from './ReviewItems';
import { ReviewState, useReview } from '../contexts/ReviewContext';
import { ProgressBar } from './ProgressBar';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { ReviewLensMenu, getReviewLens } from './ReviewLensMenu';
import { ReviewLens } from '../types/ReviewLens';
import { BasicTooltip } from './tooltip/Tooltip';
import { usePlaybook } from '../contexts/PlaybookContext';
import { LoadingSpinner } from './LoadingSpinner';
import { useRallyApi } from '../hooks/useRallyApi';

const getStartMessage = (reviewState: ReviewState) => {
  switch (reviewState) {
    case ReviewState.NotStarted:
      return `Improve your document with suggestions from Spellbook’s AI Review. \nSelect a Review type to get started.`;
    case ReviewState.NoResults:
      return 'No recommendations generated. Try reviewing again after updating your document';
    case ReviewState.ClearedResults:
      return 'Great work, all of your recommendations have been resolved.';
    default:
      return '';
  }
};
const getButtonText = (reviewState: ReviewState) => {
  switch (reviewState) {
    case ReviewState.NotStarted:
      return 'Start Review';
    case ReviewState.NoResults:
    case ReviewState.HasResults:
    case ReviewState.ClearedResults:
      return 'Review Again';
    default:
      return '';
  }
};

function StartReview() {
  const isReviewsEnabled = useFeatureToggle('reviews');
  const { reviewState } = useReview();

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto pt-10">
      <div className="mx-6 mb-3 whitespace-pre-line text-center text-sm leading-[1.15rem] text-gray-2">
        {getStartMessage(reviewState)}
      </div>
      {isReviewsEnabled && <ReviewLensMenu />}
    </div>
  );
}

function ReviewResults() {
  const {
    reviewState,
    isReviewLoading,
    reviewProgress,
    insertAll,
    isInsertAllLoading,
    cancelStream,
    resetReviewState,
    reviewLensState,
    origin,
  } = useReview();
  const { createPlaybook, isCreatingPlaybook } = usePlaybook();
  const { generatePlaybookTitle } = useRallyApi();
  const { trackEvent } = useAnalytics();
  const {
    lens: reviewLens,
    instruction: customInstruction = '',
    playbook,
  } = reviewLensState;
  const [customPlaybookSaved, setCustomPlaybookSaved] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const enableSavePrompt =
    customInstruction?.trim() !== playbook?.parameters?.instruction.trim();

  const insertAllCallback = useDebouncedCallback(
    async () => {
      trackEvent('Apply All Review Items', { origin });
      await insertAll();
    },
    100,
    { leading: true, trailing: false },
  );

  const handleSavePrompt = useCallback(async () => {
    let title = 'Custom Playbook';
    try {
      setIsGeneratingTitle(true);
      title = await generatePlaybookTitle(customInstruction);
    } catch (error) {
      console.error(
        'Error generating title for playbook, using defaul titlet.',
        error,
      );
    } finally {
      setIsGeneratingTitle(false);
    }
    await createPlaybook(title, customInstruction);
    setCustomPlaybookSaved(true);
  }, [createPlaybook, customInstruction, generatePlaybookTitle]);

  const lensState =
    reviewLens === ReviewLens.Custom ? (
      <div className="mb-2 flex flex-col">
        <div className="mb-2 flex justify-between">
          <div className="flex items-center">
            <img
              className="h-5 w-5"
              src={`${getReviewLens(reviewLens).icon}`}
              alt={`${getReviewLens(reviewLens).label} icon`}
            />
            {!enableSavePrompt ? (
              <>
                {playbook?.title && playbook?.title.length > 50 ? (
                  <BasicTooltip
                    tooltip={playbook?.title}
                    placement="bottom-start"
                  >
                    <p className="ml-1 max-w-[90%] cursor-default truncate font-bold leading-6">
                      {playbook?.title}
                    </p>
                  </BasicTooltip>
                ) : (
                  <p className="ml-1 cursor-default font-bold leading-6">
                    {playbook?.title}
                  </p>
                )}
              </>
            ) : (
              <p className="ml-1 cursor-default font-bold leading-6">
                {getReviewLens(reviewLens).label}
              </p>
            )}
          </div>
          {enableSavePrompt && (
            <button
              type="button"
              disabled={customPlaybookSaved}
              className="flex items-center space-x-2 rounded bg-purple-2 px-2 py-1 text-sm font-bold text-purple-3"
              onClick={handleSavePrompt}
            >
              <FontAwesomeIcon
                icon={customPlaybookSaved ? faBookmarkSolid : faBookmark}
                className="text-xs font-bold text-purple-3"
              />
              <span>{customPlaybookSaved ? 'Saved' : 'Save prompt'}</span>
              {(isGeneratingTitle || isCreatingPlaybook) && (
                <LoadingSpinner variant="small" color="#4D69F9" />
              )}
            </button>
          )}
        </div>
        <BasicTooltip tooltip={customInstruction} placement="bottom-start">
          <div className="truncate italic text-gray-2">{customInstruction}</div>
        </BasicTooltip>
      </div>
    ) : (
      <div className="flex items-center">
        <img
          className="h-5 w-5"
          src={`${getReviewLens(reviewLens).icon}`}
          alt={`${getReviewLens(reviewLens).label} icon`}
        />
        <p className="ml-1 cursor-default font-bold leading-6">
          {getReviewLens(reviewLens).label}
        </p>
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      {isReviewLoading && <div className="mx-2 mb-2">{lensState}</div>}
      {isReviewLoading && (
        <div className="flex w-full items-center gap-2 px-2 pb-2">
          <div className="grow">
            <ProgressBar progress={reviewProgress} />
          </div>
          <div className="flex-none">
            <button
              type="button"
              className="rounded px-2 py-1 text-xs font-semibold text-black hover:bg-gray-5"
              onClick={() => {
                trackEvent('Cancel Review', { origin });
                cancelStream();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {!isReviewLoading && (
        <div className="flex flex-none justify-end p-2 pb-5">
          <div
            className={`flex w-full ${
              reviewLens === ReviewLens.Custom ? 'flex-col' : 'justify-between'
            }`}
          >
            {lensState}
            <button
              type="button"
              className={`group/button flex items-center justify-center gap-1 rounded border border-gray-4 px-2 py-1 text-xs font-semibold text-gray-1 hover:border-purple-1 hover:text-purple-1 ${
                reviewLens === ReviewLens.Custom ? 'self-end' : ''
              }`}
              onClick={() => {
                trackEvent('Refresh Review Items', { origin });
                resetReviewState();
              }}
            >
              <FontAwesomeIcon
                icon={faArrowsRotate}
                className="font-bold text-gray-2 group-hover/button:text-purple-1"
              />
              {getButtonText(reviewState)}
            </button>
          </div>
        </div>
      )}
      <ReviewItems />
      <div className="flex-none px-2 pb-4 pt-2">
        <button
          type="button"
          disabled={isReviewLoading}
          className={`w-full rounded  bg-purple-1 py-2.5 text-center ${
            isReviewLoading ? 'opacity-40' : 'hover:shadow-3'
          }  text-white `}
          onClick={insertAllCallback}
        >
          {isInsertAllLoading ? (
            <>
              Applying...
              <FontAwesomeIcon
                beatFade
                className="ml-1 text-sm"
                icon={faWandMagicSparkles}
              />
            </>
          ) : (
            'Apply all'
          )}
        </button>
      </div>
    </div>
  );
}

export function Review() {
  const { isDebugEnabled } = useSpellbook();
  const { isInsertAllLoading, reviewState } = useReview();

  return (
    <div
      className={`relative h-full overflow-y-hidden ${
        isDebugEnabled ? 'debug-enabled' : ''
      }`}
    >
      {isInsertAllLoading && (
        <div className="absolute inset-0 z-10 bg-white opacity-50" />
      )}
      {reviewState === ReviewState.HasResults ||
      reviewState === ReviewState.InProgress ? (
        <ReviewResults />
      ) : (
        <StartReview />
      )}
    </div>
  );
}
