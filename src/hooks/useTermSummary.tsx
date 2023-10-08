import React, { useCallback, useEffect, useState } from 'react';

import { TermSummary } from '../components/TermSummary';
import { useSpellbook } from '../contexts/SpellbookContext';
import { DocumentService } from '../services/DocumentService';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from './useRallyApi';
import { useChat } from './useChat';
import { useDocumentData } from '../contexts/DocumentDataContext';
import { MessageType } from '../types/ChatMessage';

const SPELL_NAME = 'Term Summary (Detailed)';

export function useTermSummary() {
  const [updateLastSpell, setUpdateLastSpell] = useState(false);
  const { termSummary } = useRallyApi();
  const { insertBotMessage, insertUserMessage, replaceMessage } = useChat();
  const { lastSpellName, setLastSpell } = useSpellbook();
  const {
    documentData: { classification, nextDetailedTerms },
    updateDocumentData,
  } = useDocumentData();

  const castTermSummary = useCallback(async () => {
    const newMessage = insertUserMessage('Term Summary', true);
    const responseKey = `response-${newMessage.key}`;
    const response = insertBotMessage(
      'Generating term summary...',
      MessageType.SPELL_CAST,
      responseKey,
      newMessage.key,
      true,
    );

    await Word.run(async (context) => {
      const getDetailedTerms = async () => {
        const documentText = await DocumentService.getDocumentText(context);
        const { terms } = await termSummary(documentText, classification);
        return terms;
      };
      try {
        const detailedTermsPromise = nextDetailedTerms || getDetailedTerms();
        // Wait at least 1s to make it seem like work is being done.
        const [detailedTerms] = await Promise.all([
          detailedTermsPromise,
          new Promise((r) => {
            setTimeout(r, 1000);
          }),
        ]);
        const message = (
          <>
            {detailedTerms
              // @ts-ignore  FIX-ME
              .filter(({ type }) => type !== 'Definition')
              // @ts-ignore  FIX-ME
              .map(({ name, summary }) => (
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
        updateDocumentData({ detailedTerms });
      } catch (error) {
        replaceMessage({
          ...response,
          message: `${response.message} Sorry, something went wrong. Please wait a few seconds and try again.`,
          messageType: MessageType.ERROR,
          isCasting: false,
        });
        handleException(error);
      } finally {
        updateDocumentData({ nextDetailedTerms: getDetailedTerms() });
        setUpdateLastSpell(true);
      }
    });
  }, [
    insertUserMessage,
    insertBotMessage,
    termSummary,
    replaceMessage,
    classification,
    nextDetailedTerms,
    updateDocumentData,
  ]);

  useEffect(() => {
    if (lastSpellName !== SPELL_NAME && !updateLastSpell) {
      return;
    }
    setUpdateLastSpell(false);
    setLastSpell({
      recastLastSpell: () => castTermSummary(),
      lastSpellName: SPELL_NAME,
    });
  }, [lastSpellName, castTermSummary, setLastSpell, updateLastSpell]);

  return castTermSummary;
}
