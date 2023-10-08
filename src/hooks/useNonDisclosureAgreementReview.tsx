import React, { useCallback } from 'react';

import { useSpellbook } from '../contexts/SpellbookContext';
import { DocumentService } from '../services/DocumentService';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from './useRallyApi';
import { useChat } from './useChat';
import { MessageType } from '../types/ChatMessage';

export function useNonDisclosureAgreementReview() {
  const { nonDisclosureAgreementReview } = useRallyApi();
  const { insertBotMessage, insertUserMessage, replaceMessage } = useChat();
  const { setLastSpell } = useSpellbook();

  const castNonDisclosureAgreementReview = useCallback(async () => {
    const newMessage = insertUserMessage(
      'Non-Disclosure Agreement Review',
      true,
    );
    const responseKey = `response-${newMessage.key}`;
    const responseMessage = insertBotMessage(
      'Reviewing non-disclosure agreement...',
      MessageType.SPELL_CAST,
      responseKey,
      newMessage.key,
      true,
    );

    await Word.run(async (context) => {
      try {
        const documentText = await DocumentService.getDocumentText(context);
        const { responses } = await nonDisclosureAgreementReview(documentText);
        replaceMessage({
          ...responseMessage,
          message: (
            <div>
              {responses.map(({ _id, name, response }) => (
                <React.Fragment key={_id}>
                  <p key={_id}>
                    <strong>{name}</strong>
                    <br />
                    {response}
                  </p>
                  <br />
                </React.Fragment>
              ))}
            </div>
          ),
          messageType: MessageType.SPELL_RESULT,
          isCasting: false,
        });
      } catch (error) {
        replaceMessage({
          ...responseMessage,
          message: `${responseMessage.message} Sorry, something went wrong. Please wait a few seconds and try again.`,
          messageType: MessageType.ERROR,
          isCasting: false,
        });
        handleException(error);
      } finally {
        setLastSpell({
          recastLastSpell: () => castNonDisclosureAgreementReview(),
          lastSpellName: 'Non-Disclosure Agreement Review',
        });
      }
    });
  }, [
    insertUserMessage,
    insertBotMessage,
    nonDisclosureAgreementReview,
    replaceMessage,
    setLastSpell,
  ]);

  return castNonDisclosureAgreementReview;
}
