import 'pure-react-carousel/dist/react-carousel.es.css';
import { faFileImport } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  ButtonBack,
  ButtonNext,
  CarouselContext,
  DotGroup,
  Slide,
  Slider,
} from 'pure-react-carousel';
import { Transition } from '@headlessui/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useSubscribe } from 'use-pubsub-js';

import { toast } from 'react-toastify';
import { decode } from 'html-entities';
import { useSearchParams } from 'react-router-dom';
import { CaretLeft, CaretRight, Plus, PushPin, X } from '@phosphor-icons/react';
import { DraftEvents } from '../common/DraftEvents';
import { useDraft, DraftActionEnum } from '../contexts/DraftContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { DraftCard } from './DraftCard';
import { DraftAction } from './DraftAction';
import { LoadingSkeleton } from './LoadingSkeleton';
import { handleException } from '../utils/ErrorUtils';
import { DocumentService } from '../services/DocumentService';
import { fakCopy } from '../icons/fakSpellIcons';
import { useDocumentData } from '../contexts/DocumentDataContext';
import { copyToClipboard } from '../utils/ClipboardUtils';
import { BasicTooltip } from './tooltip/Tooltip';

export function DraftCardCarousel() {
  const { trackEvent } = useAnalytics();
  const carouselContext = useContext(CarouselContext);
  const {
    setStoreState,
    subscribe,
    unsubscribe,
    state: { currentSlide },
  } = carouselContext;
  const [currentIndex, setCurrentIndex] = useState(currentSlide);
  const { draftInstructions, drafts } = useDraft();
  const { updateDocumentData } = useDocumentData();

  const [searchParams] = useSearchParams();
  const refreshSuggestions = searchParams.get('refreshsuggestions');

  useEffect(() => {
    function onChange() {
      // eslint-disable-next-line react/destructuring-assignment
      setCurrentIndex(carouselContext.state.currentSlide);
    }
    subscribe(onChange);
    return () => unsubscribe(onChange);
  }, [carouselContext, subscribe, unsubscribe]);

  const { dismissDraft, removeDraft, updateDraft, draftMore, isDraftLoading } =
    useDraft();

  const onDraftMore = () => {
    trackEvent('Draft More');
    draftMore(draftInstructions).catch((error) => handleException(error));
  };

  const draftMoreEnabled = currentIndex === drafts.length - 1;
  const draftEventRef = useRef<DraftEvents | null>(null);

  useSubscribe({
    token: DraftEvents.DraftInserted,
    handler: () => {
      draftEventRef.current = DraftEvents.DraftInserted;
    },
  });

  useSubscribe({
    token: DraftEvents.DraftsInserted,
    handler: () => {
      draftEventRef.current = DraftEvents.DraftsInserted;
    },
  });

  useEffect(() => {
    if (draftEventRef.current) {
      switch (draftEventRef.current) {
        case DraftEvents.DraftInserted: {
          setStoreState({ currentSlide: drafts.length - 1 });
          break;
        }
        case DraftEvents.DraftsInserted: {
          const firstUnpinned = drafts.findIndex((draft) => !draft.pinned);
          if (firstUnpinned >= 0) {
            setStoreState({ currentSlide: firstUnpinned });
          }
          break;
        }
        default: {
          console.log(`unknown draft event: ${draftEventRef.current}`);
          return;
        }
      }

      draftEventRef.current = null;
    }
  }, [drafts, setStoreState]);

  const enableActions =
    !!drafts.length &&
    !drafts?.[currentIndex]?.loading &&
    !drafts?.[currentIndex]?.placeholder;

  return (
    <div className="mt-3 flex h-full flex-initial flex-col border-none px-4 pb-4 outline-none">
      <div className="my-2 flex items-center justify-between">
        <div className="space-x-2">
          <BasicTooltip tooltip="Previous">
            <ButtonBack
              data-testid="previous-draft"
              className={currentIndex === 0 ? 'text-gray-3' : 'text-gray-1'}
              disabled={currentIndex === 0}
              onClick={() => trackEvent('Draft Carousel Back')}
            >
              <CaretLeft size={21} weight="bold" />
            </ButtonBack>
          </BasicTooltip>
          {draftMoreEnabled && !isDraftLoading ? (
            <BasicTooltip tooltip="Draft more options">
              <button
                type="button"
                data-testid="draft-more"
                onClick={onDraftMore}
              >
                <Plus size={21} weight="bold" />
              </button>
            </BasicTooltip>
          ) : (
            <BasicTooltip tooltip="Next">
              <ButtonNext
                data-testid="next-draft"
                className={!enableActions ? 'text-gray-3' : 'text-gray-1'}
                disabled={!enableActions}
                onClick={() => trackEvent('Draft Carousel Forward')}
              >
                <CaretRight size={21} weight="bold" />
              </ButtonNext>
            </BasicTooltip>
          )}
        </div>
        <div className="flex w-11 flex-none items-center justify-between space-x-1 self-end">
          {!drafts[currentIndex]?.pinned ? (
            <DraftAction
              title="Pin"
              testId="pin-draft"
              disabled={!enableActions}
              action={() => {
                trackEvent('Pinned Draft');
                updateDraft(DraftActionEnum.PIN, {
                  ...drafts[currentIndex],
                  pinned: true,
                });
              }}
            >
              <PushPin
                size={21}
                weight="bold"
                className={!enableActions ? 'text-gray-3' : 'text-gray-1'}
              />
            </DraftAction>
          ) : (
            <DraftAction
              title="Unpin"
              testId="remove-pin"
              action={() => {
                trackEvent('Unpinned Draft');
                updateDraft(DraftActionEnum.UNPIN, {
                  ...drafts[currentIndex],
                  pinned: false,
                });
              }}
            >
              <PushPin
                size={21}
                weight="fill"
                className="text-feedback-error-medium"
              />
            </DraftAction>
          )}
          <DraftAction
            title="Remove"
            testId="remove-draft"
            disabled={!enableActions}
            action={() => {
              trackEvent('Removed Draft');
              dismissDraft(drafts[currentIndex]);
            }}
          >
            <X
              size={21}
              weight="bold"
              className={!enableActions ? 'text-gray-3' : 'text-gray-1'}
            />
          </DraftAction>
        </div>
      </div>
      {drafts.length ? (
        <Slider
          className="h-full w-full"
          classNameTrayWrap="h-full w-full"
          classNameTray="h-full w-full"
        >
          {drafts.map((draftResult, index) => (
            <Slide key={draftResult.id} index={index} className="h-full">
              <Transition
                className="h-full"
                show={!draftResult.dismissed}
                leave="display-absolute transition-transform duration-300"
                leaveFrom="translate-x-0 translate-y-0"
                leaveTo="translate-x-full translate-y-full"
                afterLeave={() => removeDraft(draftResult)}
              >
                <DraftCard draftResult={draftResult} />
              </Transition>
            </Slide>
          ))}
        </Slider>
      ) : (
        <div className="mt-[14px]">
          <LoadingSkeleton numRows={5} styleClass="last:w-[40%]" />
        </div>
      )}
      {enableActions && (
        <div className="mt-2 flex h-[26px] justify-between self-end text-xs">
          <DraftAction
            title="Copy"
            testId="copy-draft"
            showTooltip={false}
            className="mr-[5px] flex items-center justify-center rounded border-[0.5px] border-transparent bg-gray-6 px-2 py-1 hover:border-purple-1"
            action={async () => {
              trackEvent('Copied Draft');
              try {
                await copyToClipboard(decode(drafts[currentIndex].completion));
                toast.success('Draft copied to clipboard');
              } catch (error) {
                handleException(error);
                toast.error('Unable to copy draft to clipboard');
              }
            }}
          >
            <FontAwesomeIcon
              className="mr-1 text-sm"
              icon={fakCopy as IconProp}
            />
            Copy
          </DraftAction>
          <DraftAction
            title="Insert"
            testId="insert-draft"
            showTooltip={false}
            className="flex items-center justify-center rounded border-[0.5px] border-transparent bg-gray-6 px-2 py-1 hover:border-purple-1"
            action={() => {
              Word.run(async (context) => {
                trackEvent('Inserted Draft');
                const selection = await DocumentService.getSelection(context);
                const cursor = context.document
                  .getSelection()
                  .getRange('Start');

                const replacedRange = await DocumentService.replaceSelection(
                  context,
                  selection ?? cursor,
                  decode(drafts[currentIndex].completion),
                );
                await DocumentService.selectRange(context, replacedRange);

                if (refreshSuggestions) {
                  updateDocumentData({
                    detailedTerms: null,
                    nextDetailedTerms: null,
                  });
                }
              }).catch((error) => handleException(error));
            }}
          >
            <FontAwesomeIcon className="mr-1 text-sm" icon={faFileImport} />
            Insert at Cursor
          </DraftAction>
        </div>
      )}
      {drafts.length > 1 && <DotGroup className="dot-group col-start-2 mt-4" />}
    </div>
  );
}
