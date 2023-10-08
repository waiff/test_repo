import {
  Dispatch,
  SetStateAction,
  createContext,
  ReactNode,
  useCallback,
  useState,
  useMemo,
  useContext,
} from 'react';
import { v4 } from 'uuid';
import { useFlagVariation } from '@flopflip/react-broadcast';
import { useDocument } from './DocumentContext';
import { useDocumentData } from './DocumentDataContext';
import { handleException } from '../utils/ErrorUtils';
import { useRallyApi } from '../hooks/useRallyApi';
import { DocumentTargets, useCastTargets } from '../hooks/useCastTargets';
import { SpellSource } from '../common/SpellSource';
import type {
  MissingClause,
  PointsToNegotiateResult,
} from '../services/RallyApiService';
import { usePointsToNegotiate } from '../hooks/usePointsToNegotiate';

export enum SuggestionType {
  SuggestedClause = 'Suggested Clause',
  AggressiveTerm = 'Aggressive Term',
  UnusualTerm = 'Unusual Term',
  PointToNegotiate = 'Point to Negotiate',
}

export enum MissingClauseVariant {
  DaVinciStepByStep = 'da-vinci-step-by-step',
  ChatGptPushBack = 'chat-gpt-push-back',
  GenerateAndPrune = 'generate-and-prune',
  GenerateAndPruneEmbeddings = 'generate-and-prune-embeddings',
}

type SuggestedClauseItem = {
  id: string;
  type: SuggestionType.SuggestedClause;
  name: string;
  description: string;
  prompt: string;
};

type AggressiveTermItem = {
  id: string;
  type: SuggestionType.AggressiveTerm;
  name: string;
  description: string;
};

type UnusualTermItem = {
  id: string;
  type: SuggestionType.UnusualTerm;
  name: string;
  description: string;
};

type PointToNegotiateItem = {
  id: string;
  type: SuggestionType.PointToNegotiate;
  name: string;
  description: string;
};

export type SuggestionItem =
  | SuggestedClauseItem
  | AggressiveTermItem
  | UnusualTermItem
  | PointToNegotiateItem;

export type UnusualTerm = {
  name: string;
  reason: string;
};

export type AggressiveTerm = {
  name: string;
  party: string;
  reason: string;
};

export type PointToNegotiate = {
  name: string;
  reason: string;
};

export type IgnoredSuggestion = {
  type: SuggestionType;
  name: string;
};

type SuggestionsContextType = {
  generate: () => Promise<void>;
  generateMissingClauses: () => Promise<void>;
  generateUnusualTerms: () => Promise<void>;
  generateAggressiveTerms: () => Promise<void>;
  generatePointsToNegotiate: () => Promise<void>;
  suggestions: SuggestionItem[];
  ignoredSuggestions: IgnoredSuggestion[];
  setIgnoredSuggestions: Dispatch<SetStateAction<IgnoredSuggestion[]>>;
  filteredSuggestions: SuggestionItem[];
  setFilteredSuggestions: Dispatch<SetStateAction<SuggestionItem[]>>;
  isLoading: boolean;
  isSuggestedClausesLoading: boolean;
  suggestedClauses: MissingClause[];
  isUnusualTermsLoading: boolean;
  unusualTerms: UnusualTerm[];
  isAggressiveTermsLoading: boolean;
  aggressiveTerms: AggressiveTerm[];
  pointsToNegotiate: PointsToNegotiateResult;
  isError: boolean;
};

const SuggestionsContext = createContext<SuggestionsContextType | undefined>(
  undefined,
);

export function SuggestionsContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { missingClauses, fetchSpell, cast } = useRallyApi();
  const { castPointsToNegotiate } = usePointsToNegotiate();

  const missingClausesVariant = useFlagVariation('missingClausesVariant');
  const [isMissingClausesError, setIsMissingClausesError] = useState(false);

  const [isSuggestedClausesLoading, setIsSuggestedClausesLoading] =
    useState(true);
  const [suggestedClauses, setSuggestedClauses] = useState<MissingClause[]>([]);

  const [isAggressiveTermsLoading, setIsAggressiveTermsLoading] =
    useState(true);
  const [aggressiveTerms, setAggressiveTerms] = useState<AggressiveTerm[]>([]);
  const [isAggressiveTermsError, setIsAggressiveTermsError] = useState(false);

  const [isUnusualTermsLoading, setIsUnusualTermsLoading] = useState(true);
  const [unusualTerms, setUnusualTerms] = useState<UnusualTerm[]>([]);
  const [isUnusualTermsError, setIsUnusualTermsError] = useState(false);

  const [isPointsToNegotiateLoading, setIsPointsToNegotiateLoading] =
    useState(false);
  const [pointsToNegotiate, setPointsToNegotiate] =
    useState<PointsToNegotiateResult>([]);
  const [isPointsToNegotiateError, setIsPointsToNegotiateError] =
    useState(false);

  const [ignoredSuggestions, setIgnoredSuggestions] = useState<
    IgnoredSuggestion[]
  >([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    SuggestionItem[]
  >([]);
  const {
    documentData: {
      classification,
      explanation,
      detailedTerms,
      representedParty,
    },
  } = useDocumentData();
  const { getDocumentText } = useDocument();
  const { loadTargets } = useCastTargets();

  const castSpellForKey = useCallback(
    async <T = any,>(spellKey: string): Promise<T[]> => {
      const spell = await fetchSpell(spellKey);
      let spellResponse: any;
      await Word.run(async (context) => {
        let targets: DocumentTargets;
        try {
          targets = await loadTargets(context, spell.accepts);
          const documentData = Object.fromEntries(
            Object.entries(targets).map(([key, { text }]) => [key, text]),
          );
          spellResponse = await cast(
            spell._id,
            SpellSource.Insights,
            documentData,
          );
        } catch (error) {
          handleException(error);
        }
      });

      if (!spellResponse) {
        return [];
      }

      return typeof spellResponse === 'string'
        ? JSON.parse(spellResponse)
        : spellResponse;
    },
    [cast, fetchSpell, loadTargets],
  );

  const generateMissingClauses = useCallback(async () => {
    try {
      setIsSuggestedClausesLoading(true);
      const documentText = await getDocumentText();
      switch (missingClausesVariant as MissingClauseVariant) {
        case MissingClauseVariant.GenerateAndPruneEmbeddings:
        case MissingClauseVariant.GenerateAndPrune: {
          console.log('fetching missing clauses');
          const missingClausesResult = await missingClauses({
            documentText,
          });

          setSuggestedClauses(missingClausesResult.clauses);
          break;
        }
        default: {
          if (classification && explanation && detailedTerms) {
            console.log('fetching missing clauses from term summary');
            const missingClausesResult = await missingClauses({
              documentText,
              classification,
              detailedTerms,
              explanation,
            });

            setSuggestedClauses(missingClausesResult.clauses);
          }
        }
      }
    } catch (error) {
      setIsMissingClausesError(true);
      handleException(error);
    } finally {
      setIsSuggestedClausesLoading(false);
    }
  }, [
    missingClausesVariant,
    classification,
    explanation,
    detailedTerms,
    getDocumentText,
    missingClauses,
  ]);

  const generatePointsToNegotiate = useCallback(async () => {
    try {
      setIsPointsToNegotiateLoading(true);
      if (representedParty) {
        console.log('fetching points to negotiate');
        const pointsToNegotiateResult = await castPointsToNegotiate({
          source: SpellSource.Insights,
        });
        setPointsToNegotiate(pointsToNegotiateResult);
      } else {
        setPointsToNegotiate([]);
      }
    } catch (error) {
      setIsPointsToNegotiateError(true);
      handleException(error);
    } finally {
      setIsPointsToNegotiateLoading(false);
    }
  }, [castPointsToNegotiate, representedParty]);

  const generateUnusualTerms = useCallback(async () => {
    if (classification && explanation && detailedTerms) {
      setIsUnusualTermsLoading(true);
      try {
        console.log('fetching unusual terms');
        const unusualTermsResponse = await castSpellForKey<UnusualTerm>(
          'unusual-terms',
        );
        setUnusualTerms(unusualTermsResponse);
      } catch (error) {
        setIsUnusualTermsError(true);
        handleException(error);
      } finally {
        setIsUnusualTermsLoading(false);
      }
    }
  }, [classification, explanation, detailedTerms, castSpellForKey]);

  const generateAggressiveTerms = useCallback(async () => {
    if (classification && explanation && detailedTerms) {
      setIsAggressiveTermsLoading(true);
      try {
        console.log('fetching aggressive terms');
        const aggressiveTermsResponse = await castSpellForKey<AggressiveTerm>(
          'aggressive-terms',
        );
        setAggressiveTerms(aggressiveTermsResponse);
      } catch (error) {
        setIsAggressiveTermsError(true);
        handleException(error);
      } finally {
        setIsAggressiveTermsLoading(false);
      }
    }
  }, [classification, explanation, detailedTerms, castSpellForKey]);

  const generate = useCallback(async () => {
    await Promise.all([
      generateMissingClauses(),
      generateUnusualTerms(),
      generateAggressiveTerms(),
      generatePointsToNegotiate(),
    ]);
  }, [
    generateMissingClauses,
    generateUnusualTerms,
    generateAggressiveTerms,
    generatePointsToNegotiate,
  ]);

  const suggestions = useMemo(
    () => [
      ...suggestedClauses.map(
        ({ name, summary, prompt }) =>
          ({
            id: v4(),
            type: SuggestionType.SuggestedClause,
            name,
            description: summary,
            prompt,
          } satisfies SuggestedClauseItem),
      ),
      ...unusualTerms.map(
        ({ name, reason }) =>
          ({
            id: v4(),
            type: SuggestionType.UnusualTerm,
            name,
            description: reason,
          } satisfies UnusualTermItem),
      ),
      ...aggressiveTerms.map(
        ({ name, reason }) =>
          ({
            id: v4(),
            type: SuggestionType.AggressiveTerm,
            name,
            description: reason,
          } satisfies AggressiveTermItem),
      ),
      ...pointsToNegotiate.map(
        ({ name, reason }) =>
          ({
            id: v4(),
            type: SuggestionType.PointToNegotiate,
            name,
            description: reason,
          } satisfies PointToNegotiateItem),
      ),
    ],
    [suggestedClauses, unusualTerms, aggressiveTerms, pointsToNegotiate],
  );

  const value = useMemo(
    () => ({
      filteredSuggestions,
      generate,
      generateMissingClauses,
      generateUnusualTerms,
      generateAggressiveTerms,
      generatePointsToNegotiate,
      ignoredSuggestions,
      setIgnoredSuggestions,
      setFilteredSuggestions,
      isLoading:
        isSuggestedClausesLoading ||
        isUnusualTermsLoading ||
        isAggressiveTermsLoading ||
        isPointsToNegotiateLoading,
      suggestions,
      suggestedClauses,
      isSuggestedClausesLoading,
      unusualTerms,
      isUnusualTermsLoading,
      aggressiveTerms,
      isAggressiveTermsLoading,
      pointsToNegotiate,
      isError:
        isUnusualTermsError &&
        isAggressiveTermsError &&
        isMissingClausesError &&
        isPointsToNegotiateError,
    }),
    [
      filteredSuggestions,
      generate,
      generateMissingClauses,
      generateUnusualTerms,
      generateAggressiveTerms,
      generatePointsToNegotiate,
      ignoredSuggestions,
      isSuggestedClausesLoading,
      isUnusualTermsLoading,
      isAggressiveTermsLoading,
      isPointsToNegotiateLoading,
      suggestions,
      suggestedClauses,
      unusualTerms,
      aggressiveTerms,
      pointsToNegotiate,
      isUnusualTermsError,
      isAggressiveTermsError,
      isMissingClausesError,
      isPointsToNegotiateError,
    ],
  );
  return (
    <SuggestionsContext.Provider value={value}>
      {children}
    </SuggestionsContext.Provider>
  );
}

export function useSuggestions(): SuggestionsContextType {
  const context = useContext(SuggestionsContext);
  if (context === undefined) {
    throw new Error(
      'useSuggestions must be used within a SuggestionsContextProvider',
    );
  }
  return context;
}
