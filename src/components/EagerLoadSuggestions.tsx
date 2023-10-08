import { useEffect, useState } from 'react';
import { useFlagVariation } from '@flopflip/react-broadcast';
import {
  MissingClauseVariant,
  useSuggestions,
} from '../contexts/SuggestionsContext';
import { useDocumentData } from '../contexts/DocumentDataContext';

const missingClauseTermSummaryVariants = [
  MissingClauseVariant.DaVinciStepByStep,
  MissingClauseVariant.ChatGptPushBack,
];

export function EagerLoadSuggestions() {
  const [missingClausesRequested, setMissingClausesRequested] = useState(false);
  const [unusualTermsRequested, setUnusualTermsRequested] = useState(false);
  const [aggressiveTermsRequested, setAggressiveTermsRequested] =
    useState(false);
  const [pointsToNegotiateRequested, setPointsToNegotiateRequested] =
    useState(false);
  const {
    generateMissingClauses,
    generateUnusualTerms,
    generateAggressiveTerms,
    generatePointsToNegotiate,
  } = useSuggestions();
  const {
    documentData: {
      classification,
      explanation,
      detailedTerms,
      representedParty,
      parties,
    },
  } = useDocumentData();

  const missingClausesVariant = useFlagVariation(
    'missingClausesVariant',
  ) as MissingClauseVariant;

  useEffect(() => {
    if (missingClausesRequested) {
      return;
    }
    if (
      !missingClauseTermSummaryVariants.includes(missingClausesVariant) ||
      (classification && explanation && detailedTerms)
    ) {
      setMissingClausesRequested(true);
      generateMissingClauses();
    }
  }, [
    generateMissingClauses,
    missingClausesVariant,
    classification,
    detailedTerms,
    explanation,
    missingClausesRequested,
  ]);

  useEffect(() => {
    if (
      !unusualTermsRequested &&
      classification &&
      explanation &&
      detailedTerms
    ) {
      setUnusualTermsRequested(true);
      generateUnusualTerms();
    }
  }, [
    classification,
    detailedTerms,
    explanation,
    generateUnusualTerms,
    unusualTermsRequested,
  ]);

  useEffect(() => {
    if (
      !aggressiveTermsRequested &&
      classification &&
      explanation &&
      detailedTerms
    ) {
      setAggressiveTermsRequested(true);
      generateAggressiveTerms();
    }
  }, [
    aggressiveTermsRequested,
    classification,
    detailedTerms,
    explanation,
    generateAggressiveTerms,
  ]);

  useEffect(() => {
    if (!pointsToNegotiateRequested && representedParty && parties) {
      setPointsToNegotiateRequested(true);
      generatePointsToNegotiate();
    }
  }, [
    generatePointsToNegotiate,
    parties,
    pointsToNegotiateRequested,
    representedParty,
  ]);

  useEffect(() => {
    // Term Summary has been reset, also reset the requested state of dependent insights
    if (!detailedTerms) {
      if (
        missingClausesRequested &&
        missingClauseTermSummaryVariants.includes(missingClausesVariant)
      ) {
        setMissingClausesRequested(false);
      }
      if (unusualTermsRequested) {
        setUnusualTermsRequested(false);
      }
      if (aggressiveTermsRequested) {
        setAggressiveTermsRequested(false);
      }
    }
  }, [
    aggressiveTermsRequested,
    detailedTerms,
    missingClausesRequested,
    missingClausesVariant,
    unusualTermsRequested,
  ]);

  return null;
}
