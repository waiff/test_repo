import { useEffect, useRef, useState } from 'react';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';

import { useDraft, DraftActionEnum } from '../contexts/DraftContext';
import { DraftResult } from '../services/RallyApiService';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { LoadingSkeleton } from './LoadingSkeleton';

export function DraftCard({ draftResult }: { draftResult: DraftResult }) {
  const { completion, loading } = draftResult;
  const { updateDraft } = useDraft();
  const { trackEvent } = useAnalytics();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [draftText, setDraftText] = useState(draftResult.completion);

  const onChange = (event: ContentEditableEvent) => {
    setDraftText(event.target.value);
    // @ts-ignore FIX-ME
    cardRef.current.value = event.target.value;
  };

  const onBlur = () => {
    // only update the draft result if the value has changed
    setIsFocused(false);
    // @ts-ignore FIX-ME
    if (!!cardRef.current.value && cardRef.current.value !== draftText) {
      // @ts-ignore FIX-ME
      trackEvent('Edited Draft');
      updateDraft(DraftActionEnum.EDIT, {
        ...draftResult,
        // @ts-ignore FIX-ME
        completion: cardRef.current.value,
      });
    }
  };

  useEffect(() => {
    setDraftText(completion);
  }, [completion, draftResult]);

  useEffect(() => {
    if (cardRef.current) {
      setIsOverflowing(
        cardRef.current?.clientHeight < cardRef.current?.scrollHeight,
      );
    }
  }, [draftText]);

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      data-testid="draft-card"
    >
      {/* FIX-ME */}
      {/* eslint-disable-next-line no-nested-ternary */}
      {loading ? (
        <div className="mt-[14px]">
          <LoadingSkeleton numRows={5} styleClass="last:w-[40%]" />
        </div>
      ) : draftResult.placeholder ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="w-3/4 whitespace-pre-line text-center text-gray-2">
            {
              'No suggestions generated.\n Try adding more to your draft instructions.'
            }
          </div>
        </div>
      ) : (
        <div
          className={`h-full justify-between overflow-y-hidden rounded-md hover:border-purple-1 ${
            isFocused
              ? 'cursor-text border border-purple-1 p-2'
              : 'border border-transparent p-2'
          } ${isOverflowing && 'pr-0'}`}
        >
          <ContentEditable
            data-testid="draft-card-content"
            className={`box-border inline-block h-full w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap text-gray-1 outline-none ${
              isFocused && 'cursor-text'
            } ${isOverflowing && 'pr-2'}`}
            innerRef={cardRef}
            onChange={onChange}
            onBlur={onBlur}
            onCopy={(e) => {
              e.preventDefault();
              const selection = window.getSelection()?.toString();
              if (selection) {
                navigator.clipboard.writeText(selection);
              }
            }}
            onFocus={() => setIsFocused(true)}
            html={draftText}
          />
        </div>
      )}
    </div>
  );
}
