import React, { useCallback } from 'react';

import { SpellSource } from '../common/SpellSource';
import { PromptSuggestions } from '../components/PromptSuggestions';
import { useSpellbook } from '../contexts/SpellbookContext';
import { DocumentService } from '../services/DocumentService';
import { useRallyApi } from './useRallyApi';
import { useChat } from './useChat';
import { MessageType } from '../types/ChatMessage';
import { useDocumentData } from '../contexts/DocumentDataContext';

export function useDraftResume() {
  const { setChatAction } = useSpellbook();
  const { insertBotMessage, insertUserMessage, replaceMessage } = useChat();
  const { scribeDraft } = useRallyApi();
  const {
    documentData: { representedParty },
  } = useDocumentData();

  const onResume = useCallback(
    async ({
      previousRange,
      directions,
      queryKey,
    }: {
      previousRange: Word.Range;
      directions?: string;
      queryKey: string;
    }) => {
      setChatAction(null);
      const responseKey = `draft-resume-${Date.now()}`;
      const response = insertBotMessage(
        'Drafting...',
        MessageType.SPELL_CAST,
        responseKey,
        queryKey,
        true,
      );
      await Word.run(previousRange, async (context) => {
        const nextInsertionPoint = previousRange.insertText(
          '',
          Word.InsertLocation.after,
        );
        const [textBeforeCursor, textAfterCursor] =
          await DocumentService.getTextBeforeAndAfterRange(
            context,
            nextInsertionPoint,
            6_000,
          );
        const scribeResult = await scribeDraft({
          directions,
          prompt: textBeforeCursor,
          suffix: textAfterCursor,
          representedParty,
          source: SpellSource.Resume,
        });
        const { completion: scribeText } = scribeResult;

        const replacedRange = await DocumentService.replaceSelection(
          context,
          nextInsertionPoint,
          scribeText,
        );
        const totalRange = previousRange.expandTo(replacedRange);
        await DocumentService.selectRange(context, totalRange);
        previousRange.untrack();

        replaceMessage({
          ...response,
          message: `${response.message} Done!`,
          messageType: MessageType.SPELL_CAST,
          isCasting: false,
        });
        // For now, limiting to 1 resume per draft
      });
    },
    [
      insertBotMessage,
      replaceMessage,
      scribeDraft,
      setChatAction,
      representedParty,
    ],
  );

  const cancelResume = useCallback(
    ({ previousRange }: { previousRange: Word.Range }) => {
      previousRange.untrack();
      setChatAction(null);
      const response = insertUserMessage('No');
      insertBotMessage(
        'Ok, no problem.',
        MessageType.PROCESSING,
        `draft-resume-cancel-${Date.now()}`,
        response.key,
      );
    },
    [insertBotMessage, insertUserMessage, setChatAction],
  );

  const showResumePrompt = useCallback(
    ({
      queryKey,
      directions,
      previousRange,
      onCancel,
    }: {
      queryKey: string;
      directions?: string;
      previousRange: Word.Range;
      onCancel: () => void;
    }) => {
      previousRange.track();
      insertBotMessage(
        'I drafted some text for you, but I can keep going. Would you like me to continue?',
        MessageType.PROCESSING,
        `draft-resume-prompt-${Date.now()}`,
        queryKey,
      );

      setChatAction(
        <PromptSuggestions
          promptSuggestions={[
            {
              suggestion: 'Yes',
              onClick: () => {
                onResume({ previousRange, directions, queryKey });
              },
            },
            {
              suggestion: 'No thank you',
              onClick: () => {
                cancelResume({ previousRange });
                if (onCancel) {
                  onCancel();
                }
              },
            },
          ]}
        />,
      );
    },
    [insertBotMessage, cancelResume, onResume, setChatAction],
  );

  return { showResumePrompt };
}
