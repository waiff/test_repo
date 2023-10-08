import { useFeatureToggle } from '@flopflip/react-broadcast';
import { useCallback, useEffect } from 'react';

import { Spell, SpellAccepts, SpellTag } from '../services/RallyApiService';
import { SpellOption } from '../common/SpellOption';
import { SpellSource } from '../common/SpellSource';
import { handleException } from '../utils/ErrorUtils';
import { isNotNull } from '../utils/functools';
import { useCast } from './useCast';
import { useChat } from './useChat';
import { useDirectedDraft } from './useDirectedDraft';
import { useDocumentDraft } from './useDocumentDraft';
import { useListParties } from './useListParties';
import { useMissingClauses } from './useMissingClauses';
import { useNonDisclosureAgreementReview } from './useNonDisclosureAgreementReview';
import { usePointsToNegotiate } from './usePointsToNegotiate';
import { useQuickDraft } from './useQuickDraft';
import { useRallyApi } from './useRallyApi';
import { useRewrite } from './useEdit';
import { useSelection } from './useSelection';
import { useSpellbook } from '../contexts/SpellbookContext';
import { useTermSummary } from './useTermSummary';
import { useTermSummaryConcise } from './useTermSummaryConcise';
import { useWoodPurchaseAgreement } from './useWoodPurchaseAgreement';
import { useSpellValidator } from './useSpellValidator';

const DRAFT_HELP_TEXT = 'Place cursor where you want to add language.';
const REWRITE_HELP_TEXT = 'Modify the selected section.';

export function useSpellList({ focusInput }: { focusInput: () => void }): {
  spells: SpellOption[];
  summonSpells: () => Promise<void>;
  isSummoningComplete: boolean;
} {
  const isWoodPurchaseAgreementEnabled = useFeatureToggle(
    'woodPurchaseAgreement',
  );
  const isNonDisclosureAgreementReviewEnabled = useFeatureToggle(
    'nonDisclosureAgreementReview',
  );
  const isAutoCompleteEnabled = useFeatureToggle('spellbookAutocomplete');
  const isDocumentDraftingEnabled = useFeatureToggle('documentDrafting');
  const isReviewsEnabled = useFeatureToggle('reviews');

  const {
    setLastSpell,
    isSummoningComplete,
    setIsSummoningComplete,
    summonedSpells,
    setSummonedSpells,
    spells,
    setSpells,
  } = useSpellbook();
  const { hasSelection, isSelectionRequired } = useSelection();
  const { isLongDoc, isDisabledForLongDocs } = useSpellValidator();
  const { summon } = useRallyApi();
  const cast = useCast();
  const missingClauses = useMissingClauses();
  const quickDraft = useQuickDraft();
  const draft = useDirectedDraft();
  const draftFromPrecedent = useDocumentDraft();
  const rewrite = useRewrite({ focusInput });
  const termSummary = useTermSummary();
  const termSummaryConcise = useTermSummaryConcise();
  const woodPurchaseAgreement = useWoodPurchaseAgreement();
  const nonDisclosureAgreementReview = useNonDisclosureAgreementReview();
  const listParties = useListParties();
  const { pointsToNegotiateSpell } = usePointsToNegotiate({ focusInput });

  const { insertBotMessage } = useChat();

  const castSpell = useCallback(
    async ({ spell, source }: { spell: Spell; source: SpellSource }) => {
      setLastSpell({ lastSpellName: undefined, recastLastSpell: undefined });
      await cast(spell, source);
      setLastSpell({
        lastSpellName: spell.name,
        recastLastSpell: () => {
          castSpell({ spell, source: SpellSource.Recast });
        },
      });
    },
    [setLastSpell, cast],
  );

  const summonSpells = useCallback(async () => {
    try {
      const { spells: newSpells } = await summon();
      setSummonedSpells(
        newSpells.filter(
          ({ name, categories = [] }) =>
            name.toLowerCase() !== 'draft' ||
            (isWoodPurchaseAgreementEnabled &&
              categories.find((category) =>
                category.name.match(/wood purchase agreement/i),
              )) ||
            (isNonDisclosureAgreementReviewEnabled &&
              categories.find(
                (category) => category._id === '640214e449a29986acca8db2',
              )),
        ),
      );
    } catch (error) {
      handleException(error);
    } finally {
      setIsSummoningComplete(true);
    }
  }, [
    summon,
    setSummonedSpells,
    isWoodPurchaseAgreementEnabled,
    isNonDisclosureAgreementReviewEnabled,
    setIsSummoningComplete,
  ]);

  useEffect(() => {
    summonSpells()
      .then(() => console.log('spells summoned'))
      .catch((error) => handleException(error));
  }, [summonSpells]);

  useEffect(() => {
    const summonedSpellOptions: SpellOption[] = summonedSpells
      .map((spell) => {
        if (spell.name.toLowerCase() === 'missing clauses') {
          return {
            key: 'missing-clauses',
            label: spell.name,
            helpText: spell.helpText,
            icon: spell.icon,
            tags: spell.tags ?? [],
            accepts: spell.accepts ?? [],
            action: () =>
              missingClauses({
                shortDocumentSpell: spell,
              }),
            categories: spell.categories,
          };
        }
        if (spell.name.toLowerCase() === 'term summary (detailed)') {
          return {
            key: 'term-summary',
            label: spell.name,
            helpText: spell.helpText,
            icon: spell.icon,
            tags: spell.tags ?? [],
            accepts: spell.accepts ?? [],
            action: termSummary,
            categories: spell.categories,
          };
        }
        if (spell.name.toLowerCase() === 'term summary (concise)') {
          return {
            key: spell._id,
            label: spell.name,
            helpText: spell.helpText,
            icon: spell.icon,
            tags: spell.tags ?? [],
            accepts: spell.accepts ?? [],
            action: termSummaryConcise,
            categories: spell.categories,
          };
        }
        if (spell.name.toLowerCase() === 'list parties') {
          return {
            key: spell._id,
            label: spell.name,
            helpText: spell.helpText,
            icon: spell.icon,
            tags: spell.tags ?? [],
            accepts: spell.accepts ?? [],
            action: listParties,
            categories: spell.categories,
          };
        }
        return {
          key: spell._id,
          label: spell.name,
          helpText: spell.helpText,
          icon: spell.icon,
          tags: spell.tags ?? [],
          accepts: spell.accepts ?? [],
          action: async ({
            source = SpellSource.SpellSelector,
          }: {
            source: SpellSource;
          }) => castSpell({ spell, source }),
          categories: spell.categories,
        };
      })
      .filter(isNotNull);

    summonedSpellOptions.push(pointsToNegotiateSpell);

    const draftSpellOptions: SpellOption[] = [
      {
        key: 'quick-draft',
        label: isAutoCompleteEnabled ? 'Autocomplete' : 'Quick Draft',
        helpText: DRAFT_HELP_TEXT,
        icon: 'faPen',
        action: async ({
          source = SpellSource.SpellSelector,
        }: {
          source: SpellSource;
        }) => quickDraft({ source }),
      },
      {
        key: 'directed-draft',
        label: isAutoCompleteEnabled
          ? 'Autocomplete with Instructions'
          : 'Directed Draft',
        helpText: DRAFT_HELP_TEXT,
        icon: 'faPenLine',
        tags: [SpellTag.beta],
        action: () => draft({ source: SpellSource.SpellSelector }),
      },
      {
        key: 'rewrite',
        label: 'Rewrite',
        helpText: REWRITE_HELP_TEXT,
        accepts: [SpellAccepts.selection],
        icon: 'faPenSwirl',
        action: () => rewrite({ source: SpellSource.SpellSelector }),
      },
    ];
    if (isDocumentDraftingEnabled) {
      draftSpellOptions.splice(2, 0, {
        key: 'draft-new-document',
        label: 'Draft From Precedent',
        icon: 'faPenLine',
        tags: [SpellTag.beta],
        action: () => draftFromPrecedent(),
      });
    }

    const customSpellOptions: SpellOption[] = [
      ...(isWoodPurchaseAgreementEnabled
        ? [
            {
              key: 'wood-purchase-agreement',
              label: 'Wood Purchase Agreement (Full Review)',
              helpText:
                'Review a wood purchase agreement and compare it to the standard',
              accepts: [SpellAccepts.full],
              tags: [SpellTag.custom],
              action: async () => woodPurchaseAgreement(),
            },
          ]
        : []),
      ...(isNonDisclosureAgreementReviewEnabled
        ? [
            {
              key: 'non-disclosure-agreement-review',
              label: 'Non-Disclosure Agreement (Full Review)',
              helpText:
                'Review a non-disclosure agreement and compare it to the standard',
              accepts: [SpellAccepts.full],
              tags: [SpellTag.custom],
              action: async () => nonDisclosureAgreementReview(),
            },
          ]
        : []),
    ];

    const allSpells = [
      ...draftSpellOptions,
      ...customSpellOptions,
      ...summonedSpellOptions,
    ].map((spell) => {
      const { accepts } = spell;
      if (!accepts?.length) {
        // Spell accepts all inputs
        return spell;
      }
      if (!hasSelection && isSelectionRequired(spell)) {
        return {
          ...spell,
          disabled: true,
        };
      }
      if (isLongDoc && isDisabledForLongDocs(spell)) {
        return {
          ...spell,
          disabled: true,
        };
      }
      return spell;
    });

    setSpells(allSpells);
  }, [
    castSpell,
    draft,
    hasSelection,
    insertBotMessage,
    missingClauses,
    quickDraft,
    rewrite,
    summonedSpells,
    termSummary,
    termSummaryConcise,
    isSelectionRequired,
    listParties,
    isWoodPurchaseAgreementEnabled,
    woodPurchaseAgreement,
    isNonDisclosureAgreementReviewEnabled,
    nonDisclosureAgreementReview,
    setSpells,
    isAutoCompleteEnabled,
    pointsToNegotiateSpell,
    isLongDoc,
    isDisabledForLongDocs,
    isDocumentDraftingEnabled,
    draftFromPrecedent,
    isReviewsEnabled,
  ]);

  return { spells, summonSpells, isSummoningComplete };
}
