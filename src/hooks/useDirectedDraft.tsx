import { useCallback } from 'react';

import { SpellSource } from '../common/SpellSource';
import { useSpellbook } from '../contexts/SpellbookContext';
import { DocumentService } from '../services/DocumentService';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from './useRallyApi';
import { useChat } from './useChat';
import { useDraftResume } from './useDraftResume';
import { MessageType } from '../types/ChatMessage';
import { useDocumentData } from '../contexts/DocumentDataContext';

export function useDirectedDraft() {
  const { setChatAction, setLastSpell, setPromptCollector } = useSpellbook();
  const { insertBotMessage, insertUserMessage, replaceMessage } = useChat();
  const { scribeDraft } = useRallyApi();
  const { showResumePrompt } = useDraftResume();
  const {
    documentData: { representedParty },
  } = useDocumentData();

  const draft = useCallback(
    async (instruction: string, queryKey: string, source: SpellSource) => {
      const responseKey = `draft-response-${queryKey}`;
      const response = insertBotMessage(
        'Drafting...',
        MessageType.SPELL_CAST,
        responseKey,
        queryKey,
        true,
      );
      await Word.run(async (context) => {
        try {
          const [textBeforeCursor, textAfterCursor] =
            await DocumentService.getTextBeforeAndAfterCursor(context, 6_000);
          const selection = await DocumentService.getSelection(context);
          const scribeResult = await scribeDraft({
            directions: instruction,
            prompt: textBeforeCursor,
            suffix: textAfterCursor,
            representedParty,
            source,
          });
          const { completion: scribeText, finished } = scribeResult;
          const replacedRange = await DocumentService.replaceSelection(
            context,
            selection,
            scribeText,
          );
          await DocumentService.selectRange(context, replacedRange);
          replaceMessage({
            ...response,
            message: `${response.message} Done!`,
            messageType: MessageType.SPELL_CAST,
            isCasting: false,
          });
          if (!finished) {
            showResumePrompt({
              queryKey: responseKey,
              previousRange: replacedRange,
              directions: instruction,
              onCancel: () => {
                setLastSpell({
                  lastSpellName: 'Draft',
                  recastLastSpell: () => {
                    const newMessage = insertUserMessage(
                      `Draft: ${instruction}`,
                      true,
                    );
                    draft(instruction, newMessage.key, SpellSource.Recast);
                  },
                });
              },
            });
          } else {
            setLastSpell({
              lastSpellName: 'Draft',
              recastLastSpell: () => {
                const newMessage = insertUserMessage(
                  `Draft: ${instruction}`,
                  true,
                );
                draft(instruction, newMessage.key, SpellSource.Recast);
              },
            });
          }
        } catch (error) {
          replaceMessage({
            ...response,
            message: `${response.message} Sorry, something went wrong. Please wait a few seconds and try again.`,
            messageType: MessageType.ERROR,
            isCasting: false,
          });
          handleException(error);
        }
      });
    },
    [
      representedParty,
      insertBotMessage,
      scribeDraft,
      replaceMessage,
      insertUserMessage,
      setLastSpell,
      showResumePrompt,
    ],
  );

  const onCollectPrompt = useCallback(
    (response: string, key: string, source: SpellSource) => {
      setChatAction(null);
      // @ts-ignore  FIX-ME
      setPromptCollector(null);
      insertUserMessage(response);
      draft(response, key, source);
    },
    [setChatAction, setPromptCollector, insertUserMessage, draft],
  );

  const collectDraftPrompt = useCallback(
    ({ source }: { source: SpellSource }) => {
      const newMessage = insertUserMessage('Draft', true);
      const responseKey = `collect-prompt-${newMessage.key}`;
      setChatAction(null);
      insertBotMessage(
        'Place your cursor where you would like me to draft. What would you like me to write?',
        MessageType.PROCESSING,
        responseKey,
        newMessage.key,
      );
      setPromptCollector({
        promptText: 'Draft instructions...',
        cancelTooltip: 'Cancel Draft',
        onRespond: (response: string) =>
          onCollectPrompt(response, newMessage.key, source),
        onCancel: () => {
          // @ts-ignore  FIX-ME
          setPromptCollector(null);
          setChatAction(null);
          insertBotMessage(
            'Cancelling draft.',
            MessageType.PROCESSING,
            `cancel-prompt-${newMessage.key}`,
            newMessage.key,
          );
        },
      });
    },
    [
      insertBotMessage,
      insertUserMessage,
      onCollectPrompt,
      setChatAction,
      setPromptCollector,
    ],
  );

  return collectDraftPrompt;
}
