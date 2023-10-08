import { ChatMessage, ChatMessageUpdate } from './ChatMessage';

export enum MessageActionEnum {
  INSERT,
  REPLACE,
  UPDATE,
}

export type MessageAction =
  | {
      type: MessageActionEnum.INSERT;
      message: ChatMessage;
    }
  | {
      type: MessageActionEnum.REPLACE;
      message: ChatMessage;
    }
  | {
      type: MessageActionEnum.UPDATE;
      update: ChatMessageUpdate;
    };
