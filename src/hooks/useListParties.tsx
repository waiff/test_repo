import React, { useCallback } from 'react';

import { useSpellbook } from '../contexts/SpellbookContext';
import { DocumentService } from '../services/DocumentService';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from './useRallyApi';
import { useChat } from './useChat';
import { MessageType } from '../types/ChatMessage';

function Party({ name, role }: { name: string; role: string }) {
  return (
    <p className="mb-2 last:mb-0">
      <span className="font-semibold">{role}</span>
      <br />
      {name}
    </p>
  );
}

export function useListParties() {
  const { listParties } = useRallyApi();
  const { insertBotMessage, insertUserMessage, replaceMessage } = useChat();
  const { setLastSpell } = useSpellbook();

  const castListParties = useCallback(async () => {
    const newMessage = insertUserMessage('List Parties', true);
    const responseKey = `response-${newMessage.key}`;
    const response = insertBotMessage(
      'Listing parties...',
      MessageType.SPELL_CAST,
      responseKey,
      newMessage.key,
      true,
    );

    await Word.run(async (context) => {
      try {
        const documentText = await DocumentService.getDocumentText(context);
        const result = await listParties(documentText);
        const message = (
          <>
            {/*  @ts-ignore FIX-ME */}
            {result.parties.map(({ name, role }) => (
              <Party key={name} name={name} role={role} />
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
          recastLastSpell: () => castListParties(),
          lastSpellName: 'List Parties',
        });
      }
    });
  }, [
    insertUserMessage,
    insertBotMessage,
    listParties,
    replaceMessage,
    setLastSpell,
  ]);

  return castListParties;
}
