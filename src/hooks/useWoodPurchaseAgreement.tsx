import React, { useCallback } from 'react';

import { useSpellbook } from '../contexts/SpellbookContext';
import { DocumentService } from '../services/DocumentService';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from './useRallyApi';
import { useChat } from './useChat';
import { MessageType } from '../types/ChatMessage';

export function useWoodPurchaseAgreement() {
  const { woodPurchaseAgreement } = useRallyApi();
  const { insertBotMessage, insertUserMessage, replaceMessage } = useChat();
  const { setLastSpell } = useSpellbook();

  const castWoodPurchaseAgreement = useCallback(async () => {
    const newMessage = insertUserMessage('Wood Purchase Agreement', true);
    const responseKey = `response-${newMessage.key}`;
    const responseMessage = insertBotMessage(
      'Reviewing wood purchase agreement...',
      MessageType.SPELL_CAST,
      responseKey,
      newMessage.key,
      true,
    );

    await Word.run(async (context) => {
      try {
        const documentText = await DocumentService.getDocumentText(context);
        const { responses } = await woodPurchaseAgreement(documentText);
        replaceMessage({
          ...responseMessage,
          message: (
            <div>
              {/* @ts-ignore FIX-ME */}
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
          recastLastSpell: () => castWoodPurchaseAgreement(),
          lastSpellName: 'Wood Purchase Agreement',
        });
      }
    });
  }, [
    insertUserMessage,
    insertBotMessage,
    woodPurchaseAgreement,
    replaceMessage,
    setLastSpell,
  ]);

  return castWoodPurchaseAgreement;
}
