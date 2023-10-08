import { useCallback } from 'react';

import { TermSummary } from '../components/TermSummary';
import { useSpellbook } from '../contexts/SpellbookContext';
import { useDocumentData } from '../contexts/DocumentDataContext';
import { DocumentService } from '../services/DocumentService';
import { Spell } from '../services/RallyApiService';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from './useRallyApi';
import { useChat } from './useChat';
import { MessageType } from '../types/ChatMessage';

export function useMissingClauses() {
  const { missingClauses } = useRallyApi();
  const { insertBotMessage, insertUserMessage, replaceMessage } = useChat();
  const { setLastSpell } = useSpellbook();
  const {
    documentData: { detailedTerms, classification, explanation },
  } = useDocumentData();

  const castMissingClauses = useCallback(
    async ({ shortDocumentSpell }: { shortDocumentSpell: Spell }) => {
      const newMessage = insertUserMessage('Missing Clauses', true);
      const responseKey = `response-${newMessage.key}`;
      const response = insertBotMessage(
        'Finding missing clauses...',
        MessageType.SPELL_CAST,
        responseKey,
        newMessage.key,
        true,
      );

      await Word.run(async (context) => {
        try {
          const documentText = await DocumentService.getDocumentText(context);
          const missingClausesArgs: Parameters<typeof missingClauses> = [
            {
              documentText,
              classification,
              explanation,
            },
          ];
          if (detailedTerms) {
            missingClausesArgs[0].detailedTerms = detailedTerms;
          }
          const result = await missingClauses(...missingClausesArgs);
          const message = (
            <>
              {result.clauses.length
                ? result.clauses.map(({ name, summary }) => (
                    <TermSummary key={name} name={name} summary={summary} />
                  ))
                : 'Could not find any missing clauses.'}
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
            recastLastSpell: () =>
              castMissingClauses({
                shortDocumentSpell,
              }),
            lastSpellName: 'Missing Clauses',
          });
        }
      });
    },
    [
      insertUserMessage,
      insertBotMessage,
      missingClauses,
      replaceMessage,
      setLastSpell,
      detailedTerms,
      classification,
      explanation,
    ],
  );

  return castMissingClauses;
}
