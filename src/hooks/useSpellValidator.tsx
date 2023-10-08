import { useCallback } from 'react';

import { DocumentService } from '../services/DocumentService';
import { SpellAccepts } from '../services/RallyApiService';
import { useChat } from './useChat';
import { ChatMessage, MessageType } from '../types/ChatMessage';
import { useDocument } from '../contexts/DocumentContext';

interface LongDocDisabledArgs {
  accepts?: SpellAccepts[];
}

export function useSpellValidator() {
  const { hasSelection, isLongDoc } = useDocument();
  const { insertBotMessage, replaceMessage } = useChat();

  const isLongDocument = useCallback(async (context: Word.RequestContext) => {
    const longDoc = await DocumentService.isLongDocument(context);
    return longDoc;
  }, []);

  const isSelectionSupported = useCallback((spell: LongDocDisabledArgs) => {
    const { accepts } = spell;
    return accepts?.includes(SpellAccepts.selection);
  }, []);

  const isCustomEndpointSpell = useCallback((spell) => {
    const spellName = spell.label || spell.name;
    return (
      spellName === 'Term Summary' ||
      spellName === 'Term Summary (Concise)' ||
      spellName === 'Term Summary (Detailed)' ||
      spellName === 'Missing Clauses' ||
      spellName === 'Points to Negotiate'
    );
  }, []);

  const isDisabledForLongDocs = useCallback(
    (spell: LongDocDisabledArgs) => {
      const { accepts } = spell;
      return (
        accepts?.includes(SpellAccepts.eightPageWindow) &&
        !accepts?.includes(SpellAccepts.beginning) &&
        (!isSelectionSupported(spell) || !hasSelection) &&
        !isCustomEndpointSpell(spell)
      );
    },
    [hasSelection, isCustomEndpointSpell, isSelectionSupported],
  );

  const showDisabledForLongDocsMessage = useCallback(
    (label: string, message?: ChatMessage) => {
      const text = `${label} currently only works on documents that are 12,000 words or less. We're working to increase the scope of this Spell and welcome your feedback in the meantime!`;
      if (message) {
        replaceMessage({
          ...message,
          message: text,
          messageType: MessageType.ERROR,
          isCasting: false,
        });
      } else {
        insertBotMessage(
          text,
          MessageType.ERROR,
          `long-doc-disabled-${Date.now()}`,
          'none',
        );
      }
    },
    [replaceMessage, insertBotMessage],
  );

  return {
    isLongDoc,
    isDisabledForLongDocs,
    showDisabledForLongDocsMessage,
    isLongDocument,
  };
}
