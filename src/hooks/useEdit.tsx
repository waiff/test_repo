import React, { useCallback } from 'react';

import { SpellSource } from '../common/SpellSource';
import { PromptSuggestions } from '../components/PromptSuggestions';
import { useAuthentication } from '../contexts/AuthenticationContext';
import { useSpellbook } from '../contexts/SpellbookContext';
import { DocumentService } from '../services/DocumentService';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from './useRallyApi';
import { useChat } from './useChat';
import { useSelection } from './useSelection';
import { MessageType } from '../types/ChatMessage';

export function useRewrite({ focusInput }: { focusInput: () => void }) {
  const { user } = useAuthentication();
  const { setChatAction, setLastSpell, setPromptCollector } = useSpellbook();
  const { insertBotMessage, insertUserMessage, replaceMessage } = useChat();
  const { scribeRewrite } = useRallyApi();
  const { showSelectionRequiredMessage, hasSelection, getSelection } =
    useSelection();

  const rewrite = useCallback(
    async (instruction: string, queryKey: string, source: SpellSource) => {
      const responseKey = `rewrite-response-${queryKey}`;
      const response = insertBotMessage(
        'Rewriting...',
        MessageType.SPELL_CAST,
        responseKey,
        queryKey,
        true,
      );
      await Word.run(async (context) => {
        try {
          const { hasSelection: contextHasSelection, selection } =
            await getSelection(context);
          if (!contextHasSelection) {
            showSelectionRequiredMessage('Rewrite', response);
            return;
          }
          const selectionText = DocumentService.cleanText(selection.text);
          const scribeText = await scribeRewrite(
            [
              {
                message: instruction,
                messageType: MessageType.USER_MESSAGE,
                author: { isUser: true, name: user?.name || 'Anonymous' },
                key: `rewrite-instruction-${queryKey}`,
              },
            ],
            selectionText,
            source,
          );
          const replacedRange = await DocumentService.replaceSelection(
            context,
            selection,
            scribeText,
          );
          await DocumentService.selectRange(context, replacedRange);
          replaceMessage({
            ...response,
            message: `${response.message} Done!`,
            messageType: MessageType.SPELL_CAST,
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
            lastSpellName: 'Rewrite',
            recastLastSpell: () => {
              const newMessage = insertUserMessage(
                `Rewrite: ${instruction}`,
                true,
              );
              rewrite(instruction, newMessage.key, SpellSource.Recast);
            },
          });
        }
      });
    },
    [
      insertBotMessage,
      scribeRewrite,
      user?.name,
      replaceMessage,
      insertUserMessage,
      setLastSpell,
      showSelectionRequiredMessage,
      getSelection,
    ],
  );

  const onCollectPrompt = useCallback(
    (response: string, key: string, source: SpellSource) => {
      setChatAction(null);
      setPromptCollector(null);
      insertUserMessage(response);
      rewrite(response, key, source);
    },
    [setChatAction, setPromptCollector, insertUserMessage, rewrite],
  );

  const collectRewritePrompt = useCallback(
    ({ source }: { source: SpellSource }) => {
      const newMessage = insertUserMessage('Rewrite', true);
      const responseKey = `collect-prompt-${newMessage.key}`;
      if (!hasSelection) {
        showSelectionRequiredMessage('Rewrite');
        return;
      }
      insertBotMessage(
        'Sure, I can rewrite this text. What would you like to do?',
        MessageType.PROCESSING,
        responseKey,
        newMessage.key,
      );
      setChatAction(
        <PromptSuggestions
          promptSuggestions={[
            ...['Fix spelling mistakes', 'Make it more concise.'].map(
              (suggestion) => ({
                suggestion,
                onClick: () =>
                  onCollectPrompt(suggestion, newMessage.key, source),
              }),
            ),
            {
              suggestion: 'Something else...',
              onClick: () => {
                focusInput();
                setChatAction(null);
              },
            },
          ]}
        />,
      );
      setPromptCollector({
        promptText: 'Rewrite instructions...',
        cancelTooltip: 'Cancel Rewrite',
        onRespond: (response: string) =>
          onCollectPrompt(response, newMessage.key, source),
        onCancel: () => {
          setPromptCollector(null);
          setChatAction(null);
          insertBotMessage(
            'Cancelling rewrite.',
            MessageType.PROCESSING,
            `cancel-prompt-${newMessage.key}`,
            newMessage.key,
          );
        },
      });
    },
    [
      focusInput,
      insertBotMessage,
      insertUserMessage,
      onCollectPrompt,
      setChatAction,
      setPromptCollector,
      showSelectionRequiredMessage,
      hasSelection,
    ],
  );

  return collectRewritePrompt;
}
