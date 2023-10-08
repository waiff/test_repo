import { ReactElement } from 'react';

export type ChatMessageAuthor = {
  name?: string;
  isUser: boolean;
};

export enum MessageType {
  SPELL_CAST = 'spell_cast',
  SPELL_CAST_TARGET = 'spell_cast_target',
  SPELL_RESULT = 'spell_result',
  USER_MESSAGE = 'user_message',
  ERROR = 'error',
  ASSISTANT_RESPONSE = 'assistant_response',
  PROCESSING = 'processing',
  CUSTOM = 'custom',
}

export type ChatMessage = {
  message: ReactElement | string;
  messageType: MessageType;
  author: ChatMessageAuthor;
  key?: string;
  queryKey?: string;
  isCast?: boolean;
  isCasting?: boolean;
  noBubble?: boolean;
};

export type ChatMessageUpdate = {
  key: string;
} & Partial<ChatMessage>;
