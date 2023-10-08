import * as Sentry from '@sentry/react';
import React, { useCallback } from 'react';

import { useFeatureToggle } from '@flopflip/react-broadcast';
import { SpellSource } from '../common/SpellSource';
import { CastTargetMessage } from '../components/CastTargetMessage';
import { useSpellbook } from '../contexts/SpellbookContext';
import { Spell, SpellAccepts } from '../services/RallyApiService';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from './useRallyApi';
import { DocumentTargets, useCastTargets } from './useCastTargets';
import { useChat } from './useChat';
import { useSelection } from './useSelection';
import { MessageType } from '../types/ChatMessage';
import { useSpellValidator } from './useSpellValidator';
import { useAnalytics } from '../contexts/AnalyticsContext';

function messageUpdater() {
  let whitespaceCount = 0;
  let hasSeenCharacter = false;

  return (message: string, token: string) =>
    message +
    token
      .split('')
      .map((char: string) => {
        if (char.match(/\S/)) {
          hasSeenCharacter = true;
        }

        const isWhitespace = char.match(/\s/);
        if (!message.length && isWhitespace && !hasSeenCharacter) {
          return null;
        }

        if (isWhitespace) {
          whitespaceCount += 1;
        } else {
          whitespaceCount = 0;
        }

        if (whitespaceCount >= 2) {
          return null;
        }

        return char;
      })
      .filter((char) => !!char)
      .join('');
}

export function useCast(): (
  spell: Spell,
  source: SpellSource,
) => Promise<void> {
  const isStreamingEnabled = useFeatureToggle('streamCast');
  const { insertUserMessage, insertBotMessage, replaceMessage } = useChat();
  const { cast, streamCast } = useRallyApi();
  const { setLastSpell } = useSpellbook();
  const { isSelectionRequired, showSelectionRequiredMessage, getSelection } =
    useSelection();
  const { loadTargets } = useCastTargets();
  const {
    isLongDocument,
    isDisabledForLongDocs,
    showDisabledForLongDocsMessage,
  } = useSpellValidator();
  const { trackEvent } = useAnalytics();

  const castSpell = useCallback(
    async (spell: Spell, source: SpellSource) => {
      const newMessage = insertUserMessage(spell.name, true);
      const responseKey = `response-${newMessage.key}`;

      if (!spell.accepts?.length) {
        Sentry.captureMessage(
          'Spell cast with no accepts - manually setting defaults',
          {
            extra: { spell: spell.accepts, name: spell.name },
          },
        );
        if (!spell.accepts) {
          // eslint-disable-next-line no-param-reassign
          spell.accepts = [];
        }

        spell.accepts.push(
          SpellAccepts.selection,
          SpellAccepts.eightPageWindow,
        );
      }

      await Word.run(async (context) => {
        let targets: DocumentTargets;
        try {
          const isLongDoc = await isLongDocument(context);
          if (isSelectionRequired(spell)) {
            const { hasSelection } = await getSelection(context);
            if (!hasSelection) {
              showSelectionRequiredMessage(spell.name);
              return;
            }
          } else if (isLongDoc && isDisabledForLongDocs(spell)) {
            showDisabledForLongDocsMessage(spell.name);
            trackEvent('Disabled for Long Document Spell Clicked', { spell });
            return;
          }
          targets = await loadTargets(context, spell.accepts);
          const selectionTarget = targets[SpellAccepts.selection];
          if (selectionTarget?.text.length && selectionTarget?.range) {
            insertBotMessage(
              <CastTargetMessage name={spell.name} target={selectionTarget} />,
              MessageType.SPELL_CAST_TARGET,
            );
          }
        } catch (error) {
          handleException(error);
          insertBotMessage(
            'Sorry, something went wrong. Please wait a few seconds and try again.',
            MessageType.ERROR,
          );
          return;
        }

        const response = insertBotMessage(
          'Casting...',
          MessageType.SPELL_CAST,
          responseKey,
          newMessage.key,
          true,
        );
        try {
          const documentData = Object.fromEntries(
            Object.entries(targets).map(([key, { text }]) => [key, text]),
          );
          if (isStreamingEnabled) {
            const updateMessage = messageUpdater();
            let message = '';
            await streamCast(spell._id, source, documentData, (token) => {
              message = updateMessage(message, token);
              replaceMessage({
                ...response,
                message,
                messageType: MessageType.SPELL_RESULT,
                isCasting: false,
              });
            });
          } else {
            const responseMessage = await cast(spell._id, source, documentData);
            replaceMessage({
              ...response,
              message: responseMessage,
              messageType: MessageType.SPELL_RESULT,
              isCasting: false,
            });
          }
        } catch (error) {
          handleException(error);
          replaceMessage({
            ...response,
            message: `${response.message} Sorry, something went wrong. Please wait a few seconds and try again.`,
            messageType: MessageType.ERROR,
            isCasting: false,
          });
        } finally {
          setLastSpell({
            lastSpellName: spell.name,
            recastLastSpell: () => castSpell(spell, SpellSource.Recast),
          });
        }
      });
    },
    [
      cast,
      insertUserMessage,
      insertBotMessage,
      replaceMessage,
      setLastSpell,
      isSelectionRequired,
      showSelectionRequiredMessage,
      getSelection,
      loadTargets,
      streamCast,
      isStreamingEnabled,
      isLongDocument,
      isDisabledForLongDocs,
      showDisabledForLongDocsMessage,
      trackEvent,
    ],
  );

  return castSpell;
}
