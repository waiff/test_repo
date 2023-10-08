import React, { useCallback } from 'react';

import { TermSummary } from '../components/TermSummary';
import { useSpellbook } from '../contexts/SpellbookContext';
import { DocumentService } from '../services/DocumentService';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from './useRallyApi';
import { useChat } from './useChat';
import { MessageType } from '../types/ChatMessage';

export function useTermSummaryConcise() {
  const { termSummaryConcise } = useRallyApi();
  const { insertBotMessage, insertUserMessage, replaceMessage } = useChat();
  const { setLastSpell } = useSpellbook();

  const castTermSummary = useCallback(async () => {
    const newMessage = insertUserMessage('Term Summary (Concise)', true);
    const responseKey = `response-${newMessage.key}`;
    const response = insertBotMessage(
      'Generating term summary...',
      MessageType.SPELL_CAST,
      responseKey,
      newMessage.key,
      true,
    );

    await Word.run(async (context) => {
      try {
        const documentText = await DocumentService.getDocumentText(context);
        const result = await termSummaryConcise(documentText);
        const message = (
          <>
            {/* @ts-ignore  FIX-ME */}
            {result.terms.map(({ name, summary }) => (
              <TermSummary key={name} name={name} summary={summary} />
            ))}
          </>
        );

        replaceMessage({
          ...response,
          message,
          messageType: MessageType.SPELL_RESULT,
          isCasting: false,
        });
      } catch (error) {
        replaceMessage({
          ...response,
          message: `${response.message} Sorry, something went wrong. Please wait a few seconds and try again.`,
          messageType: MessageType.ERROR,
          isCasting: false,
        });
        handleException(error);
      } finally {
        setLastSpell({
          recastLastSpell: () => castTermSummary(),
          lastSpellName: 'Term Summary (Concise)',
        });
      }
    });
  }, [
    insertUserMessage,
    insertBotMessage,
    termSummaryConcise,
    replaceMessage,
    setLastSpell,
  ]);

  return castTermSummary;
}
