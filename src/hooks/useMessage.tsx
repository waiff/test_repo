import { useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { useFeatureToggle } from '@flopflip/react-broadcast';
import { useAuthentication } from '../contexts/AuthenticationContext';
import { useSpellbook } from '../contexts/SpellbookContext';
import { DocumentService } from '../services/DocumentService';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from './useRallyApi';
import { useChat } from './useChat';
import { ChatMessage, MessageType } from '../types/ChatMessage';
import { ResendAction } from '../components/ResendAction';
import { LoadingIndicator } from '../components/LoadingIndicator';

export function useMessage() {
  const { user } = useAuthentication();
  const { messages, setChatAction } = useSpellbook();
  const { chat, streamChat } = useRallyApi();
  const { insertMessage, replaceMessage } = useChat();

  const streamChatEnabled = useFeatureToggle('streamChat');

  const sendMessageToApi = useDebouncedCallback(
    async (chatMessages: ChatMessage[], newMessage: ChatMessage) => {
      const responseKey = `response-${newMessage.key}`;
      const responsePlaceholder: ChatMessage = {
        author: { isUser: false, name: 'Spellbook' },
        key: responseKey,
        message: (
          <div className="flex h-4 items-center">
            <LoadingIndicator />
          </div>
        ),
        messageType: MessageType.PROCESSING,
        queryKey: newMessage.key,
      };

      insertMessage(responsePlaceholder);

      return Word.run(async (context) => {
        const selection = await DocumentService.getSelectedText(context);
        const documentText = await DocumentService.getDocumentText(context);

        try {
          if (streamChatEnabled) {
            let responseMessage = '';
            await streamChat(
              [...chatMessages, newMessage],
              documentText,
              selection,
              (token) => {
                responseMessage += token;
                replaceMessage({
                  ...responsePlaceholder,
                  message: responseMessage,
                  messageType: MessageType.ASSISTANT_RESPONSE,
                });
              },
            );

            if (responseMessage === '') {
              // no data received. Something went wrong.
              handleException(new Error('No data received from stream chat'));
              replaceMessage({
                ...responsePlaceholder,
                message:
                  'Sorry, something went wrong. Please wait a few seconds and try again.',
                messageType: MessageType.ERROR,
              });
            } else {
              setChatAction(
                <ResendAction
                  onClick={() => {
                    setChatAction(null);
                    const resendMessage = {
                      message: newMessage.message,
                      messageType: MessageType.USER_MESSAGE,
                      author: {
                        isUser: true,
                        name: user?.name || 'Anonymous',
                      },
                      key: `query-${Date.now()}`,
                    };
                    insertMessage(resendMessage);
                    sendMessageToApi(messages, resendMessage);
                  }}
                  label="Resend for more ideas"
                />,
              );
            }
          } else {
            const responseMessage = (
              await chat([...chatMessages, newMessage], documentText, selection)
            ).message;
            replaceMessage({
              ...responsePlaceholder,
              message: responseMessage,
              messageType: MessageType.ASSISTANT_RESPONSE,
            });
            setChatAction(
              <ResendAction
                onClick={() => {
                  setChatAction(null);
                  const resendMessage = {
                    message: newMessage.message,
                    messageType: MessageType.USER_MESSAGE,
                    author: { isUser: true, name: user?.name || 'Anonymous' },
                    key: `query-${Date.now()}`,
                  };
                  insertMessage(resendMessage);
                  sendMessageToApi(messages, resendMessage);
                }}
                label="Resend for more ideas"
              />,
            );
          }
        } catch (error) {
          handleException(error);
          replaceMessage({
            ...responsePlaceholder,
            message:
              'Sorry, something went wrong. Please wait a few seconds and try again.',
            messageType: MessageType.ERROR,
          });
        }
      });
    },
    600,
  );

  const sendMessage = useCallback(
    async (chatMessages: ChatMessage[], newMessage: ChatMessage) => {
      setChatAction(null);
      insertMessage(newMessage);
      await sendMessageToApi(chatMessages, newMessage);
    },
    [setChatAction, insertMessage, sendMessageToApi],
  );

  return useCallback(
    async (message: string) => {
      const newMessage = {
        message,
        messageType: MessageType.USER_MESSAGE,
        author: { isUser: true, name: user?.name || 'Anonymous' },
        key: `query-${Date.now()}`,
      };
      await sendMessage(messages, newMessage);
    },
    [sendMessage, user, messages],
  );
}
