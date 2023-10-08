import { useCallback, useEffect, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useCombobox } from 'downshift';
import { NavLink, useSearchParams } from 'react-router-dom';
import { useFeatureToggle } from '@flopflip/react-broadcast';
import { useDraft } from '../contexts/DraftContext';
import { MissingClause } from '../services/RallyApiService';
import { useSuggestions } from '../contexts/SuggestionsContext';
import { useAnalytics } from '../contexts/AnalyticsContext';

function SuggestedItem({
  getItemProps,
  suggestion,
  index,
  highlightedIndex,
}: {
  getItemProps: any;
  suggestion: MissingClause;
  index: number;
  highlightedIndex: number;
}) {
  return (
    <li
      key={`${suggestion.name}`}
      className={`${
        highlightedIndex === index &&
        'cursor-pointer bg-gray-6 last:rounded-b-[12px]'
      } flex flex-col px-4 py-2`}
      {...getItemProps({ suggestion, index })}
    >
      <span>{suggestion.name}</span>
    </li>
  );
}

function ComboBox({
  handleDraft,
  onSubmit,
}: {
  handleDraft: (instructions?: string) => void;
  onSubmit: (event: any) => void;
}) {
  const isClauseLibraryEnabled = useFeatureToggle('clauseLibrary');
  const { trackEvent } = useAnalytics();
  const { drafts, draftInstructions, setDraftInstructions } = useDraft();
  const { suggestedClauses, isSuggestedClausesLoading } = useSuggestions();
  const [suggestions, setSuggestions] = useState([] as MissingClause[]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    MissingClause[]
  >([]);
  const [numberOfLines, setNumberOfLines] = useState(1);

  const handleInputValueChange = useCallback(
    (value: string) => {
      setDraftInstructions(value);
    },
    [setDraftInstructions],
  );

  // Handle manually to avoid a jumping cursor:
  // https://github.com/downshift-js/downshift/issues/1108#issuecomment-842407759
  const handleNativeChangeEvent = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      handleInputValueChange(value);
    },
    [handleInputValueChange],
  );

  const {
    isOpen,
    openMenu,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items: suggestedClauses ?? [],
    defaultHighlightedIndex: 0,
    defaultIsOpen: !(drafts.length || isClauseLibraryEnabled),
    itemToString(item) {
      return item ? item.prompt : draftInstructions;
    },
    inputValue: draftInstructions,
    onStateChange: (changes) => {
      const { type, inputValue } = changes;
      if (
        type === useCombobox.stateChangeTypes.InputKeyDownEnter ||
        type === useCombobox.stateChangeTypes.ItemClick
      ) {
        if (filteredSuggestions.length && inputValue) {
          setDraftInstructions(inputValue);
          handleDraft(inputValue);
        } else {
          handleDraft(draftInstructions);
        }
      }
      if (type === useCombobox.stateChangeTypes.InputBlur) {
        if (changes.selectedItem && filteredSuggestions.length) {
          setDraftInstructions(changes.selectedItem.prompt);
        }
      }
    },
  });

  const fixPlaceholderCaps = (placeholder: string): string => {
    if (!placeholder) {
      return placeholder;
    }
    return placeholder
      .split(' ')
      .map((word: string) => {
        if (word && word === word.toUpperCase()) {
          return word.charAt(0) + word.slice(1).toLowerCase();
        }
        return word;
      })
      .join(' ');
  };

  const placeholderPrompt =
    fixPlaceholderCaps(filteredSuggestions?.[highlightedIndex]?.prompt) ||
    fixPlaceholderCaps(suggestions?.[0]?.prompt);

  useEffect(() => {
    if (!isSuggestedClausesLoading && !!suggestedClauses?.length) {
      setSuggestions(suggestedClauses);
    } else {
      setSuggestions([]);
    }
  }, [isSuggestedClausesLoading, suggestedClauses]);

  useEffect(() => {
    if (draftInstructions?.trim().length > 0) {
      setFilteredSuggestions(
        suggestions?.filter((suggestion) =>
          suggestion.name
            .toLowerCase()
            .includes(draftInstructions.toLowerCase()),
        ),
      );
    } else {
      setFilteredSuggestions(suggestions);
    }
  }, [draftInstructions, suggestions]);

  const showingSuggestions = isOpen && filteredSuggestions.length;
  const showingDrafts = !!drafts.length;

  return (
    <div className="relative mx-4 flex flex-col">
      <div
        className="mx-2 mb-2 text-center text-sm text-gray-2"
        hidden={showingDrafts}
      >
        {isClauseLibraryEnabled
          ? 'Draft a starting point for a new clause or search your library for a trusted precedent'
          : 'Tell Spellbook what you would like to draft. The more details you include, the better your results will be.'}
      </div>
      <form onSubmit={onSubmit}>
        <div
          className={`mt-2 box-border flex w-full items-center border-gray-5 transition-all ${
            numberOfLines > 1 || showingSuggestions
              ? 'rounded-[16px]'
              : 'rounded-[22px]'
          } ${
            showingSuggestions ? 'rounded-b-none border-b-gray-5' : 'shadow-1'
          } border px-1 py-2`}
        >
          <TextareaAutosize
            minRows={showingSuggestions && !draftInstructions ? 7 : 1}
            maxRows={draftInstructions && !showingDrafts ? 7 : 5}
            onHeightChange={(height, { rowHeight }) => {
              setNumberOfLines(Math.ceil(height / rowHeight));
            }}
            placeholder={placeholderPrompt ?? 'An indemnification clause'}
            className="w-full resize-none px-3 text-[15px] leading-[21px] outline-none"
            spellCheck={false}
            {...getInputProps({
              value: draftInstructions,
              onClick: openMenu,
              onKeyDown(event) {
                if (
                  !showingSuggestions &&
                  (event.key === 'ArrowUp' || event.key === 'ArrowDown')
                ) {
                  // @ts-ignore
                  // eslint-disable-next-line no-param-reassign
                  event.preventDownshiftDefault = true;
                }
                if (highlightedIndex === -1) {
                  if (event.key === 'Enter') {
                    if (event.shiftKey) {
                      // @ts-ignore
                      // eslint-disable-next-line no-param-reassign
                      event.preventDownshiftDefault = true;
                    } else {
                      event.preventDefault();
                      if (draftInstructions?.trim().length > 0) {
                        onSubmit(event);
                      } else {
                        event.stopPropagation();
                      }
                    }
                  }
                  if (event.key === 'Escape') {
                    setDraftInstructions('');
                  }
                }
              },
            })}
            onChange={handleNativeChangeEvent}
          />
        </div>
      </form>
      <div className="relative z-10">
        <div className="absolute w-full">
          <ul
            className={`items-center justify-center rounded-b-[16px] border border-t-0 border-blue-1 bg-white p-1 ${
              !(isOpen && !!filteredSuggestions?.length) && 'hidden'
            }`}
            {...getMenuProps()}
          >
            {isOpen &&
              !isSuggestedClausesLoading &&
              filteredSuggestions.length > 0 &&
              filteredSuggestions?.map((suggestion, index) => (
                <SuggestedItem
                  key={`${suggestion.name}`}
                  getItemProps={getItemProps}
                  suggestion={suggestion}
                  index={index}
                  highlightedIndex={highlightedIndex}
                />
              ))}
          </ul>
        </div>
      </div>
      <div
        className={`mt-4 flex items-center justify-center space-x-3 ${
          showingDrafts ? 'hidden' : ''
        }`}
      >
        <button
          type="button"
          onClick={onSubmit}
          className={` ${
            isClauseLibraryEnabled ? 'rounded-lg' : 'rounded-full'
          } bg-rally-gradient px-4 py-2 text-sm font-bold text-white`}
        >
          Draft
        </button>
        {isClauseLibraryEnabled && (
          <NavLink
            onClick={(e) => {
              trackEvent?.(`Viewed Library Tab (from Drafts)`);
              e.stopPropagation();
            }}
            to={{
              pathname: '/taskpane/library/search',
              search: '?fromDraftTab=true',
            }}
            className="text-purple-1 underline underline-offset-2"
          >
            Search Library
          </NavLink>
        )}
      </div>
    </div>
  );
}

export function DraftTabInput({
  handleDraft,
  onSubmit,
}: {
  handleDraft: (instructions?: string) => void;
  onSubmit: (event: any) => void;
}) {
  const { draftInstructions, setDraftInstructions } = useDraft();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!draftInstructions && searchParams.has('refreshsuggestions')) {
      searchParams.delete('refreshsuggestions');
      setSearchParams(searchParams);
    }
  }, [setDraftInstructions, searchParams, setSearchParams, draftInstructions]);

  return <ComboBox handleDraft={handleDraft} onSubmit={onSubmit} />;
}
