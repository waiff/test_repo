import { useCallback } from 'react';
import { useDraft } from '../contexts/DraftContext';
import { DraftCardCarousel } from './DraftCardCarousel';
import { DraftTabInput } from './DraftTabInput';

export function Draft() {
  const { drafts, isDraftLoading, draft, draftInstructions } = useDraft();
  const emptyDraftState = !drafts.length && !isDraftLoading;

  const handleDraft = useCallback(
    async (instructions?: string) => {
      await draft(instructions ?? draftInstructions);
    },
    [draft, draftInstructions],
  );

  const onSubmit = useCallback(
    (event) => {
      event.preventDefault();
      handleDraft();
      event.target.blur();
    },
    [handleDraft],
  );

  return (
    <div
      className={`flex h-full flex-col items-center ${
        emptyDraftState && 'justify-center'
      } overflow-y-hidden`}
    >
      <div
        className={`${emptyDraftState && 'mb-32'}
        w-full
        `}
      >
        <DraftTabInput handleDraft={handleDraft} onSubmit={onSubmit} />
      </div>
      {(!!drafts.length || isDraftLoading) && (
        <div className="h-full min-h-0 w-full flex-auto">
          <DraftCardCarousel />
        </div>
      )}
    </div>
  );
}
