import { useCallback } from 'react';

import { DocumentService } from '../services/DocumentService';
import { SpellAccepts } from '../services/RallyApiService';
import { useChat } from './useChat';
import { ChatMessage, MessageType } from '../types/ChatMessage';
import { useDocument } from '../contexts/DocumentContext';

interface SelectionRequiredArgs {
  accepts?: SpellAccepts[];
}

export function useSelection() {
  const { insertBotMessage, replaceMessage } = useChat();

  const { hasSelection, refreshDocumentState } = useDocument();

  const getSelection = useCallback(async (context: Word.RequestContext) => {
    const selection = await DocumentService.getSelection(context);
    const documentText = DocumentService.cleanText(selection.text);
    return { hasSelection: !!documentText.length, selection };
  }, []);

  const isSelectionRequired = useCallback((spell: SelectionRequiredArgs) => {
    const { accepts } = spell;
    return accepts?.includes(SpellAccepts.selection) && accepts.length === 1;
  }, []);

  const showSelectionRequiredMessage = useCallback(
    (label: string, message?: ChatMessage) => {
      const text = `${label} only operates on selections. Select some text in the document and try casting again!`;
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
          `request-selection-${Date.now()}`,
          'none',
        );
      }
    },
    [replaceMessage, insertBotMessage],
  );

  return {
    hasSelection,
    getSelection,
    refreshDocumentState,
    isSelectionRequired,
    showSelectionRequiredMessage,
  };
}
