import { useCallback, useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faSparkles } from '@fortawesome/sharp-regular-svg-icons';
import { faCircleXmark } from '@fortawesome/sharp-solid-svg-icons';
import { faSend } from '@fortawesome/pro-light-svg-icons';
import { v4 } from 'uuid';
import { useSpellbook } from '../contexts/SpellbookContext';
import { useChat } from './useChat';
import { MessageType } from '../types/ChatMessage';
import { loadFile } from '../utils/FileUtils';
import { BasicTooltip } from '../components/tooltip/Tooltip';
import { ProgressBar } from '../components/ProgressBar';
import {
  ReviewContextProvider,
  ReviewState,
  useReview,
} from '../contexts/ReviewContext';
import { ReviewLens } from '../types/ReviewLens';
import { Drawer } from '../components/Drawer';
import { Review } from '../components/Review';
import { ReviewScope, RevisionType } from '../services/RallyApiService';
import { useAnalytics } from '../contexts/AnalyticsContext';

enum DraftStage {
  SELECT_FILE,
  PROVIDE_PROMPT,
  RUNNING_REVIEW,
  FINISHED_REVIEW,
  CANCELLED_REVIEW,
}

function DocumentDraft() {
  const [stage, setState] = useState<DraftStage>(DraftStage.SELECT_FILE);
  const [instructions, setInstructions] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousStageRef = useRef<DraftStage>(stage);
  const hiddenFileInput = useRef<HTMLInputElement>(null);

  const {
    generateReviewItems,
    reviewProgress,
    cancelStream,
    updateReviewLens,
    numReviewItemsGenerated,
    reviewState,
    reviewCancelled,
  } = useReview();
  const { trackEvent } = useAnalytics();
  const [showRevisions, setShowRevisions] = useState(false);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      trackEvent('Draft From Precedent - File Selected');
      setFileName(file.name);
      loadFile(file);
      setState(DraftStage.PROVIDE_PROMPT);
    },
    [trackEvent],
  );

  const handleFileClear = useCallback(() => {
    trackEvent('Draft From Precedent - File Cleared');
    setFileName(null);
    setState(DraftStage.SELECT_FILE);
  }, [trackEvent]);

  const handleSubmitReview = useCallback(() => {
    trackEvent('Draft From Precedent - Review Started');
    setState(DraftStage.RUNNING_REVIEW);
    updateReviewLens({
      lens: ReviewLens.Custom,
      instruction: instructions,
      includedRevisionTypes: [RevisionType.comment, RevisionType.modification],
    });
    generateReviewItems(ReviewLens.Custom, ReviewScope.document, instructions);
  }, [generateReviewItems, instructions, trackEvent, updateReviewLens]);

  const handleStopReview = useCallback(() => {
    trackEvent('Draft From Precedent - Review Stopped');
    cancelStream();
  }, [cancelStream, trackEvent]);

  const handleViewRevisions = useCallback(() => {
    trackEvent('Draft From Precedent - View Revisions');
    setShowRevisions(true);
  }, [trackEvent]);

  useEffect(() => {
    if (stage !== previousStageRef.current) {
      containerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
      previousStageRef.current = stage;
    }
  }, [stage]);

  useEffect(() => {
    if (
      stage === DraftStage.RUNNING_REVIEW &&
      (reviewState === ReviewState.HasResults ||
        reviewState === ReviewState.NoResults)
    ) {
      trackEvent('Draft From Precedent - Review Completed');
      setState(DraftStage.FINISHED_REVIEW);
    }
    if (stage === DraftStage.RUNNING_REVIEW && reviewCancelled) {
      trackEvent('Draft From Precedent - Review Cancelled');
      setState(DraftStage.CANCELLED_REVIEW);
    }
  }, [reviewCancelled, reviewState, stage, trackEvent]);

  return (
    <div className="my-2 flex flex-col gap-3" ref={containerRef}>
      <div className="w-fit self-end rounded-lg bg-blue-1 px-2.5 py-[5px] text-white">
        <FontAwesomeIcon icon={faSparkles} className="mr-2" />
        Draft From Precedent
      </div>
      Please provide a reference document.
      {stage === DraftStage.SELECT_FILE ? (
        <>
          <div className="w-fit">
            <BasicTooltip tooltip="Select reference document">
              <button
                type="button"
                className="flex w-fit items-center gap-2 rounded bg-purple-1 px-2 py-1 text-white"
                onClick={() => hiddenFileInput.current?.click()}
              >
                <FontAwesomeIcon icon={faFileLines} />
                Browse
              </button>
            </BasicTooltip>
          </div>
          <input
            data-testid="document-draft-file-input"
            title="Select reference document"
            className="hidden"
            type="file"
            ref={hiddenFileInput}
            accept=".docx"
            onChange={handleFileSelect}
          />
        </>
      ) : (
        <>
          <div className="flex w-fit items-center gap-2 rounded-lg border border-gray-3 px-2 py-1">
            <FontAwesomeIcon icon={faFileLines} />
            {fileName}
            <BasicTooltip tooltip="Remove reference document">
              <button
                type="button"
                onClick={handleFileClear}
                aria-label="Remove reference document"
              >
                <FontAwesomeIcon icon={faCircleXmark} />
              </button>
            </BasicTooltip>
          </div>
          <div>
            What are the new terms you&apos;d like to use? I&apos;ll suggest
            revisions to try and align your reference document with your new
            terms.
          </div>
          {(stage === DraftStage.PROVIDE_PROMPT ||
            stage === DraftStage.CANCELLED_REVIEW) && (
            <div className="relative w-full">
              <TextareaAutosize
                minRows={1}
                maxRows={16}
                placeholder="New terms..."
                defaultValue={instructions}
                className="relative w-full resize-none rounded-lg border p-2 pb-7 outline-none focus:border-blue-1"
                onChange={(event) => setInstructions(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmitReview();
                  }
                }}
                /* eslint-disable-next-line jsx-a11y/no-autofocus */
                autoFocus
              />
              <FontAwesomeIcon
                icon={faSend}
                title="Start draft"
                onClick={handleSubmitReview}
                className={`absolute bottom-3 right-3 z-10 text-xl ${
                  !instructions.length
                    ? 'cursor-auto text-gray-3'
                    : 'cursor-pointer text-blue-1'
                }`}
              />
            </div>
          )}
          {(stage === DraftStage.RUNNING_REVIEW ||
            stage === DraftStage.FINISHED_REVIEW) && (
            <div className="whitespace-pre-line rounded-lg border border-gray-3 p-2">
              {instructions}
            </div>
          )}
          {stage === DraftStage.RUNNING_REVIEW && (
            <>
              <div>
                Revising your reference document to use the new terms you
                provided. This will take a few minutes to complete but you can
                continue using Spellbook in the meantime.
              </div>
              <ProgressBar progress={reviewProgress} />
            </>
          )}
          {stage === DraftStage.FINISHED_REVIEW && (
            <div>
              Done! I flagged {numReviewItemsGenerated} revision
              {numReviewItemsGenerated !== 1 ? 's' : ''} that should align your
              reference document with your new terms.
            </div>
          )}
          {stage === DraftStage.CANCELLED_REVIEW && (
            <div>
              Stopped. You can update your terms and rerun the process
              {numReviewItemsGenerated > 0
                ? ` or view
              the ${numReviewItemsGenerated} revision${
                    numReviewItemsGenerated !== 1 ? 's' : ''
                  } I found`
                : ''}
              .
            </div>
          )}
          {(stage === DraftStage.RUNNING_REVIEW ||
            numReviewItemsGenerated > 0) && (
            <div className="flex gap-4">
              <button
                type="button"
                className="rounded bg-purple-1 px-2 py-1 text-white"
                onClick={handleViewRevisions}
              >
                {`View ${
                  numReviewItemsGenerated > 0 ? numReviewItemsGenerated : ''
                } revision${numReviewItemsGenerated !== 1 ? 's' : ''}`}
              </button>
              {stage === DraftStage.RUNNING_REVIEW && (
                <button type="button" onClick={handleStopReview}>
                  Stop
                </button>
              )}
              {stage === DraftStage.FINISHED_REVIEW && (
                <button type="button" onClick={handleSubmitReview}>
                  Rerun
                </button>
              )}
            </div>
          )}
          <Drawer isOpen={showRevisions} setIsOpen={setShowRevisions} title="">
            <Review />
          </Drawer>
        </>
      )}
    </div>
  );
}

export function useDocumentDraft() {
  const { setChatAction } = useSpellbook();
  const { insertMessage } = useChat();

  const draftFromPrecedent = useCallback(() => {
    setChatAction(null);
    const key = v4();
    insertMessage({
      message: (
        <ReviewContextProvider origin="Draft From Precedent">
          <DocumentDraft />
        </ReviewContextProvider>
      ),
      messageType: MessageType.CUSTOM,
      author: { isUser: false },
      noBubble: true,
      key,
    });
  }, [insertMessage, setChatAction]);

  return draftFromPrecedent;
}
