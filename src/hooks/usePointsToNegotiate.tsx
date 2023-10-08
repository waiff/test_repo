import React, { useCallback, useMemo } from 'react';

import { MessageType } from '../types/ChatMessage';
import { SpellAccepts } from '../services/RallyApiService';
import { handleException } from '../utils/ErrorUtils';
import { DocumentTargets } from './useCastTargets';
import { useChat } from './useChat';
import { useDocumentData } from '../contexts/DocumentDataContext';
import { useRallyApi } from './useRallyApi';
import { useSpellbook } from '../contexts/SpellbookContext';
import { CastTargetMessage } from '../components/CastTargetMessage';
import { SpellSource } from '../common/SpellSource';
import { DocumentService } from '../services/DocumentService';
import { PromptSuggestions } from '../components/PromptSuggestions';
import { Party } from '../types/Party';

type CastPointsToNegotiateArgs = {
  onLoadTargets?: (targets: DocumentTargets) => void | Promise<void>;
  source?: SpellSource;
  party?: Party;
};

function PointToNegotiate({
  name,
  summary,
}: {
  name: string;
  summary: string;
}) {
  return (
    <p className="mb-2 last:mb-0">
      <span className="font-semibold">{name}</span>
      <br />
      {summary}
    </p>
  );
}

export function usePointsToNegotiate({
  focusInput,
}: {
  focusInput?: () => void;
} = {}) {
  const { pointsToNegotiate } = useRallyApi();
  const { insertBotMessage, insertUserMessage, updateMessage } = useChat();
  const { setLastSpell, setChatAction, setPromptCollector } = useSpellbook();
  const {
    documentData: { representedParty, parties },
    updateDocumentData,
  } = useDocumentData();

  const castPointsToNegotiate = useCallback(
    async ({ onLoadTargets, source, party }: CastPointsToNegotiateArgs = {}) =>
      Word.run(async (context) => {
        const [full, selection] = await Promise.all([
          DocumentService.getDocumentText(context),
          DocumentService.getSelection(context),
        ]);

        const targets: DocumentTargets = {
          [SpellAccepts.full]: { text: full },
        };

        if (selection.text.trim()) {
          selection.track();
          targets[SpellAccepts.selection] = {
            text: selection.text,
            range: selection,
          };
        }

        if (parties) {
          targets[SpellAccepts.parties] = { text: JSON.stringify(parties) };
        }

        if (representedParty) {
          targets[SpellAccepts.representedParty] = {
            text: JSON.stringify(representedParty),
          };
        }

        if (onLoadTargets) {
          await onLoadTargets(targets);
        }

        const documentData = Object.fromEntries(
          Object.entries(targets).map(([key, value]) => [key, value.text]),
        );

        if (party) {
          documentData.representedParty = JSON.stringify(party);
        }

        return pointsToNegotiate(documentData, source);
      }),
    [parties, pointsToNegotiate, representedParty],
  );

  const castPointsToNegotiateChatWithParty = useCallback(
    async (party: Party, { source }: { source?: SpellSource } = {}) => {
      const spellName = `Points to Negotiate for ${party.name}`;

      const newMessage = insertUserMessage(spellName, true);
      const responseKey = `response-${newMessage.key}`;

      try {
        const result = await castPointsToNegotiate({
          party,
          source,
          onLoadTargets: (targets) => {
            const selectionTarget = targets[SpellAccepts.selection];
            if (selectionTarget?.text.length && selectionTarget?.range) {
              insertBotMessage(
                <CastTargetMessage name={spellName} target={selectionTarget} />,
                MessageType.SPELL_CAST_TARGET,
              );
            }
            insertBotMessage(
              'Finding points to negotiate...',
              MessageType.SPELL_CAST,
              responseKey,
              newMessage.key,
              true,
            );
          },
        });

        const message = result.length ? (
          <>
            {result.map(({ name, reason }) => (
              <PointToNegotiate key={name} name={name} summary={reason} />
            ))}
          </>
        ) : (
          `There's nothing I think you need to negotiate.`
        );

        updateMessage({
          key: responseKey,
          message,
          messageType: MessageType.SPELL_RESULT,
          isCasting: false,
        });
      } catch (error: any) {
        updateMessage({
          key: responseKey,
          message: `Sorry, something went wrong. Please wait a few seconds and try again.`,
          messageType: MessageType.ERROR,
          isCasting: false,
        });
        handleException(error);
      } finally {
        setLastSpell({
          recastLastSpell: () =>
            castPointsToNegotiateChatWithParty(party, {
              source: SpellSource.Recast,
            }),
          lastSpellName: spellName,
        });
      }
    },
    [
      castPointsToNegotiate,
      insertBotMessage,
      insertUserMessage,
      setLastSpell,
      updateMessage,
    ],
  );

  const onCollectRepresentedParty = useCallback(
    (party: Party, source: SpellSource) => {
      castPointsToNegotiateChatWithParty(party, { source });
      updateDocumentData({ representedParty: party });
      setChatAction(null);
      setPromptCollector(null);
    },
    [
      updateDocumentData,
      castPointsToNegotiateChatWithParty,
      setChatAction,
      setPromptCollector,
    ],
  );

  const collectRepresentedParty = useCallback(
    ({ source }: { source: SpellSource }) => {
      const newMessage = insertUserMessage('Points to Negotiate', true);
      const responseKey = `response-${newMessage.key}`;
      insertBotMessage(
        'Sure, I can find points to negotiate. Which party are you representing?',
        MessageType.PROCESSING,
        responseKey,
        newMessage.key,
      );

      const partySuggestions = parties?.length
        ? parties
        : [{ name: 'Customer' }, { name: 'Investor' }, { name: 'Vendor' }];

      setChatAction(
        <PromptSuggestions
          promptSuggestions={[
            ...partySuggestions.map((party) => ({
              suggestion: party.name,
              onClick: () => onCollectRepresentedParty(party, source),
            })),
            {
              suggestion: 'Another party...',
              onClick: () => {
                focusInput?.();
                setChatAction(null);
              },
            },
          ]}
        />,
      );

      setPromptCollector({
        promptText: 'Represented party...',
        cancelTooltip: 'Cancel Ponts to Negotiate',
        onRespond: (response: string) =>
          onCollectRepresentedParty({ name: response }, source),
        onCancel: () => {
          setPromptCollector(null);
          setChatAction(null);
          insertBotMessage(
            'Cancelling points to negotiate.',
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
      parties,
      setChatAction,
      setPromptCollector,
      onCollectRepresentedParty,
    ],
  );

  const castPointsToNegotiateChat = useCallback(
    ({ source }: { source: SpellSource }) => {
      if (!representedParty) {
        return collectRepresentedParty({ source });
      }
      return castPointsToNegotiateChatWithParty(representedParty, { source });
    },
    [
      collectRepresentedParty,
      castPointsToNegotiateChatWithParty,
      representedParty,
    ],
  );

  const pointsToNegotiateSpell = useMemo(
    () => ({
      key: '644bd2873ba86432f3192097',
      label: `Points to Negotiate`,
      helpText: 'Suggest points to negotiate.',
      icon: 'faHandshakeSimple',
      tags: [],
      categories: [],
      accepts: [
        SpellAccepts.full,
        SpellAccepts.selection,
        SpellAccepts.parties,
        SpellAccepts.representedParty,
      ],
      action: castPointsToNegotiateChat,
    }),
    [castPointsToNegotiateChat],
  );

  return {
    castPointsToNegotiate,
    castPointsToNegotiateChat,
    pointsToNegotiateSpell,
  };
}
