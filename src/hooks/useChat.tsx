import { ReactElement, useCallback } from 'react';
import { v4 } from 'uuid';

import { useAuthentication } from '../contexts/AuthenticationContext';
import { useSpellbook } from '../contexts/SpellbookContext';
import {
  ChatMessage,
  ChatMessageUpdate,
  MessageType,
} from '../types/ChatMessage';
import { MessageActionEnum } from '../types/MessageAction';

export function useChat() {
  const { user } = useAuthentication();
  const { messageDispatch } = useSpellbook();

  const insertMessage = useCallback(
    (message: ChatMessage) => {
      messageDispatch({ type: MessageActionEnum.INSERT, message });
    },
    [messageDispatch],
  );

  const insertUserMessage = useCallback(
    (message: string, isCast = false) => {
      const newMessage = {
        message,
        messageType: MessageType.USER_MESSAGE,
        author: { isUser: true, name: user?.name || 'Anonymous' },
        key: v4(),
        isCast,
      };
      insertMessage(newMessage);
      return newMessage;
    },
    [insertMessage, user],
  );

  const insertBotMessage = useCallback(
    (
      message: ReactElement | string,
      messageType: MessageType,
      key?: string,
      queryKey?: string,
      casting = false,
    ) => {
      const castMessage: ChatMessage = {
        author: { isUser: false, name: 'Spellbook' },
        key: key ?? v4(),
        message,
        messageType,
        queryKey,
        isCasting: casting,
      };
      insertMessage(castMessage);
      return castMessage;
    },
    [insertMessage],
  );

  const replaceMessage = useCallback(
    (message: ChatMessage) => {
      messageDispatch({ type: MessageActionEnum.REPLACE, message });
    },
    [messageDispatch],
  );

  const updateMessage = useCallback(
    (update: ChatMessageUpdate) => {
      messageDispatch({ type: MessageActionEnum.UPDATE, update });
    },
    [messageDispatch],
  );

  return {
    insertMessage,
    insertUserMessage,
    insertBotMessage,
    replaceMessage,
    updateMessage,
  };
}
