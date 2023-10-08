import {
  faArrowRightFromBracket,
  faPenLine,
  faXmark,
  faSquareExclamation,
} from '@fortawesome/sharp-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../../contexts/DocumentContext';
import { useDocumentData } from '../../contexts/DocumentDataContext';
import {
  SuggestionItem,
  SuggestionType,
  useSuggestions,
} from '../../contexts/SuggestionsContext';
import { ExpandableItem, useExpandableItemList } from '../ExpandableItem';
import { Header } from './Header';
import { SectionContent } from './SectionContent';
import { LoadingSkeleton } from '../LoadingSkeleton';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { useDraft } from '../../contexts/DraftContext';
import { BasicTooltip } from '../tooltip/Tooltip';

export function Suggestions() {
  const {
    documentData: { detailedTerms },
  } = useDocumentData();
  const { selectText } = useDocument();
  const {
    generate,
    suggestions,
    isLoading,
    ignoredSuggestions,
    setIgnoredSuggestions,
    filteredSuggestions,
    setFilteredSuggestions,
    isError,
  } = useSuggestions();
  const keys = useMemo(
    () => suggestions?.map(({ id }) => id) ?? [],
    [suggestions],
  );
  const { expandAll, collapseAll, isExpanded, toggle, remove, isAllExpanded } =
    useExpandableItemList(keys);
  const [isSectionExpanded, setSectionExpanded] = useState(true);
  const { trackEvent } = useAnalytics();
  const { setDraftInstructions, draft } = useDraft();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      const newFilteredSuggestions = suggestions.filter(
        ({ type, name }) =>
          !ignoredSuggestions.some(
            (ignored) =>
              ignored.type === type &&
              ignored.name.toLowerCase() === name.toLowerCase(),
          ),
      );
      setFilteredSuggestions(newFilteredSuggestions);
    }
  }, [ignoredSuggestions, isLoading, setFilteredSuggestions, suggestions]);

  const addIgnore = useCallback(
    (item: SuggestionItem) => {
      trackEvent('Ignore Suggestion', { type: item.type });
      remove(item.id);
      setIgnoredSuggestions([
        ...ignoredSuggestions,
        { type: item.type, name: item.name },
      ]);
    },
    [ignoredSuggestions, remove, setIgnoredSuggestions, trackEvent],
  );

  const getActionsForSuggestion = useCallback(
    (suggestion: SuggestionItem) => {
      const { type, name } = suggestion;
      const source = detailedTerms?.find((term) => term.name === name)?.source;
      switch (suggestion.type) {
        case SuggestionType.SuggestedClause:
          return (
            <BasicTooltip tooltip="Draft">
              <button
                type="button"
                title="Draft"
                onClick={() => {
                  trackEvent('Draft from Suggested Clause');
                  const { prompt } = suggestion;
                  navigate('/taskpane/draft?refreshsuggestions=true');
                  setDraftInstructions(prompt);
                  draft(prompt);
                }}
              >
                <FontAwesomeIcon icon={faPenLine} />
              </button>
            </BasicTooltip>
          );
        case SuggestionType.AggressiveTerm:
        case SuggestionType.UnusualTerm:
          return source ? (
            <BasicTooltip tooltip="View">
              <button
                type="button"
                onClick={() => {
                  trackEvent('Go to Term', {
                    type,
                  });
                  selectText(source);
                }}
              >
                <FontAwesomeIcon icon={faArrowRightFromBracket} />
              </button>
            </BasicTooltip>
          ) : null;
        default:
          return null;
      }
    },
    [
      detailedTerms,
      navigate,
      setDraftInstructions,
      draft,
      trackEvent,
      selectText,
    ],
  );

  return (
    <>
      <Header
        title="Suggestions"
        isSectionExpanded={isSectionExpanded}
        setSectionExpanded={(expanded: boolean) => {
          trackEvent(
            `Suggestions Section ${expanded ? 'Expanded' : 'Collapsed'}`,
          );
          setSectionExpanded(expanded);
        }}
        isLoading={isLoading}
        count={filteredSuggestions.length}
        refresh={() => {
          trackEvent('Refresh Suggestions');
          generate();
        }}
        isAllExpanded={isAllExpanded}
        expandAll={() => {
          trackEvent('Suggestions Expand All');
          expandAll();
        }}
        collapseAll={() => {
          trackEvent('Suggestions Collapse All');
          collapseAll();
        }}
      />
      <SectionContent isSectionExpanded={isSectionExpanded}>
        {!isLoading && !!filteredSuggestions?.length && !isError && (
          <div className="flex flex-col gap-2">
            {filteredSuggestions.map((suggestion) => {
              const { id, type, name, description } = suggestion;
              const expanded = isExpanded(id);
              return (
                <ExpandableItem
                  key={id}
                  title={type}
                  title2={name}
                  description={description}
                  expanded={expanded}
                  toggle={() => {
                    trackEvent(
                      `Suggestion ${expanded ? 'Collapsed' : 'Expanded'}`,
                      {
                        type,
                      },
                    );
                    toggle(id);
                  }}
                  colorClass="bg-feedback-warning-extralight"
                  actions={
                    <div className="ml-auto flex flex-nowrap gap-2">
                      {!!detailedTerms && getActionsForSuggestion(suggestion)}
                      <BasicTooltip tooltip="Ignore">
                        <button
                          type="button"
                          onClick={() => addIgnore(suggestion)}
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </BasicTooltip>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
        {!isLoading && !filteredSuggestions?.length && !isError && (
          <div>No suggestions.</div>
        )}
        {isLoading && (
          <LoadingSkeleton
            numRows={5}
            styleClass="h-8 rounded-[8px]"
            shimmer={isSectionExpanded}
          />
        )}
        {isError && !isLoading && (
          <div className="flex h-full w-full flex-col items-center justify-center py-3 text-gray-2">
            <FontAwesomeIcon
              icon={faSquareExclamation}
              className="mb-[12px] h-9 w-full"
            />
            <p className="whitespace-pre text-center text-sm leading-4">
              {`Unable to load Suggestions at\nthis time. Please refresh the\nsection or try again later.`}
            </p>
          </div>
        )}
      </SectionContent>
    </>
  );
}
