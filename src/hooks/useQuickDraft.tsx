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

export function useQuickDraft() {
  const { scribeDraft } = useRallyApi();
  const { insertBotMessage, insertUserMessage, replaceMessage } = useChat();
  const { setLastSpell } = useSpellbook();
  const { showResumePrompt } = useDraftResume();
  const {
    documentData: { representedParty },
  } = useDocumentData();

  const draftNewText = useCallback(
    async ({ source }: { source: SpellSource }) => {
      const newMessage = insertUserMessage('Draft', true);
      const responseKey = `response-${newMessage.key}`;
      const response = insertBotMessage(
        'Drafting...',
        MessageType.SPELL_CAST,
        responseKey,
        newMessage.key,
        true,
      );

      await Word.run(async (context) => {
        try {
          const [textBeforeCursor, textAfterCursor] =
            await DocumentService.getTextBeforeAndAfterCursor(context, 6_000);
          const selection = await DocumentService.getSelection(context);
          const scribeResult = await scribeDraft({
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
              onCancel: () => {
                setLastSpell({
                  recastLastSpell: () =>
                    draftNewText({ source: SpellSource.Recast }),
                  lastSpellName: 'Draft',
                });
              },
            });
          } else {
            setLastSpell({
              recastLastSpell: () =>
                draftNewText({ source: SpellSource.Recast }),
              lastSpellName: 'Draft',
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
      insertUserMessage,
      insertBotMessage,
      scribeDraft,
      replaceMessage,
      setLastSpell,
      showResumePrompt,
      representedParty,
    ],
  );

  return draftNewText;
}
