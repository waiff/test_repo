import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/sharp-regular-svg-icons';
import { useFeatureToggle } from '@flopflip/react-broadcast';
import { useDebouncedCallback } from 'use-debounce';
import { Controller, useForm } from 'react-hook-form';
import { Transition } from '@headlessui/react';
import { ReviewLens } from '../types/ReviewLens';
import listMagnifyingGlass from '../icons/review/listMagnifyingGlass.svg';
import handshake from '../icons/review/handshake.svg';
import textbox from '../icons/review/textbox.svg';
import strategy from '../icons/review/strategy.svg';
import listMagnifyingGlassGradient from '../icons/review/listMagnifyingGlassGradient.svg';
import handshakeGradient from '../icons/review/handshakeGradient.svg';
import textboxGradient from '../icons/review/textboxGradient.svg';
import strategyGradient from '../icons/review/strategyGradient.svg';
import { PlaybookDrawer } from './PlaybookDrawer';

import { useAnalytics } from '../contexts/AnalyticsContext';
import { useReview } from '../contexts/ReviewContext';
import {
  Playbook,
  ReviewScope,
  RevisionType,
} from '../services/RallyApiService';
import { getRandomInt } from '../utils/NumberUtils';
import { usePlaybook } from '../contexts/PlaybookContext';
import { LoadingSpinner } from './LoadingSpinner';
import { useSelection } from '../hooks/useSelection';
import { BasicTooltip } from './tooltip/Tooltip';
import Dropdown from './Dropdown';
import { ProgressRing } from './ProgressRing';

const CUSTOM_PROMPT_EXAMPLES = [
  'Review the document for enforceability under California law.',
  'Identify any potential long-term implications or liabilities for my client.',
  'Redact all names from this document.',
  'Update the Customer name to Acme Motors and the price to $1200/month.',
  'How can the contract be terminated, and what are the implications of termination for my client?',
  "Ensure the indemnity provisions in the contract are fair and mutual, and don't expose my client to unnecessary risk.",
];

const INSTRUCTION_LIMIT = 4000;

export const getReviewLens = (lens: ReviewLens) => {
  switch (lens) {
    case ReviewLens.Negotiator:
      return {
        lens: ReviewLens.Negotiator,
        label: 'Negotiation',
        icon: handshake,
        hoverIcon: handshakeGradient,
        description: 'Suggest changes that favour the represented party',
        buttonText: 'Run',
      };
    case ReviewLens.Custom:
      return {
        lens: ReviewLens.Custom,
        label: 'Custom',
        icon: textbox,
        hoverIcon: textboxGradient,
        description: 'Provide instructions to focus the review on any task',
        buttonText: 'Run',
      };
    case ReviewLens.Playbooks:
      return {
        lens: ReviewLens.Playbooks,
        label: 'Playbooks',
        icon: strategy,
        hoverIcon: strategyGradient,
        description:
          'Define and save custom instructions for repeatable reviews',
        buttonText: 'View',
      };
    case ReviewLens.General:
    default:
      return {
        lens: ReviewLens.General,
        label: 'General',
        icon: listMagnifyingGlass,
        hoverIcon: listMagnifyingGlassGradient,
        description: 'Scan the document for obvious risks and issues',
        buttonText: 'Run',
      };
  }
};

function ReviewScopeMenu({
  scope,
  setScope,
}: {
  scope: ReviewScope;
  setScope: (scope: ReviewScope) => void;
}) {
  const { hasSelection } = useSelection();
  const isSelectiveReviewEnabled = useFeatureToggle('selectiveReview');

  useEffect(() => {
    if (!hasSelection) {
      setScope(ReviewScope.document);
    } else {
      setScope(ReviewScope.selection);
    }
  }, [hasSelection, setScope]);

  const scopeTypes = [
    { value: ReviewScope.document, label: 'Full Document' },
    {
      value: ReviewScope.selection,
      disabled: !hasSelection,
      label: !hasSelection ? (
        <BasicTooltip tooltip="Review specific text by selecting it in the document">
          Selected Text
        </BasicTooltip>
      ) : (
        'Selected Text'
      ),
    },
  ];

  if (isSelectiveReviewEnabled) {
    return (
      <Dropdown label="Scope" value={scope} onChange={setScope}>
        {scopeTypes.map(({ value, label, disabled }) => (
          <Dropdown.Item
            key={value}
            value={value}
            label={label}
            disabled={disabled}
          />
        ))}
      </Dropdown>
    );
  }
  return <div />;
}

export function ReviewCard({
  lens: { lens, label, icon, description, hoverIcon, buttonText },
  onSubmit,
}: {
  lens: {
    lens: ReviewLens;
    label: string;
    icon: string;
    hoverIcon: string;
    description: string;
    buttonText: string;
  };
  onSubmit: (
    lens: ReviewLens,
    scope: ReviewScope,
    instruction?: string,
  ) => void;
}) {
  const { trackEvent } = useAnalytics();
  const { setIsPlaybookDrawerOpen, fetchPlaybooks, isPlaybooksLoading } =
    usePlaybook();

  const { activeReviewLens, setActiveReviewLens } = useReview();
  const isActiveLens = activeReviewLens === lens;

  const [scope, setScope] = useState(ReviewScope.document);

  const handleSubmit = async () => {
    if (lens === ReviewLens.Playbooks) {
      await fetchPlaybooks();
      if (!isPlaybooksLoading) {
        trackEvent('View Playbooks', { source: 'Playbooks Card' });
        setIsPlaybookDrawerOpen(true);
      }
    } else {
      onSubmit(lens, scope);
    }
  };

  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleOutsideClick = useCallback(
    (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setActiveReviewLens(null);
      }
    },
    [setActiveReviewLens],
  );

  useEffect(() => {
    if (isActiveLens) {
      document.addEventListener('click', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [handleOutsideClick, isActiveLens]);

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setActiveReviewLens(null);
        }
      }}
      className={`group mx-4 mb-4 w-11/12 max-w-md cursor-pointer rounded-[14px] bg-gray-5 p-0.5 transition-all hover:-translate-y-px hover:bg-gradient-to-br hover:from-blue-1 hover:to-purple-1 hover:shadow-6 hover:transition-all hover:duration-75 focus:outline-none
        ${
          isActiveLens
            ? 'z-10 -translate-y-px bg-gradient-to-br from-blue-1 to-purple-1 shadow-6 transition-all duration-75'
            : ''
        } 
      `}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() =>
          lens === ReviewLens.Playbooks
            ? handleSubmit()
            : setActiveReviewLens(lens)
        }
        onKeyDown={(e: any) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (lens === ReviewLens.Playbooks) {
              handleSubmit();
            } else {
              setActiveReviewLens(lens);
            }
          }
        }}
        className="relative grid w-full grid-cols-[auto_1fr] grid-rows-[auto_1fr] items-center gap-x-4 gap-y-1 rounded-xl bg-white px-4 py-3"
      >
        <div className="col-span-1 row-span-3 flex w-10 items-center justify-center">
          <img
            className={`h-10 w-10 group-hover:opacity-0 group-hover:transition-all group-hover:duration-75 
            ${isActiveLens && 'opacity-0 transition-all duration-75'} `}
            src={`${icon}`}
            alt={`${label} icon`}
          />
          <img
            className={`absolute left-4 h-10 w-10 opacity-0 group-hover:opacity-100 group-hover:transition-all group-hover:duration-75
                    ${
                      isActiveLens && 'opacity-100 transition-all duration-75'
                    } `}
            src={hoverIcon}
            alt={`${label} icon`}
          />
        </div>

        <h4 className="col-span-1 font-bold">{label}</h4>
        <div>
          {lens === ReviewLens.Playbooks && isPlaybooksLoading && (
            <LoadingSpinner color="#4D69F9" variant="small" />
          )}
        </div>
        <p className="col-span-2 col-start-2 row-span-2 leading-[1.15rem] text-gray-2">
          {description}
        </p>
        <Transition
          show={!!isActiveLens}
          className="col-span-3"
          enter="transition-opacity-translate duration-200"
          enterFrom="opacity-0 translate-y-[-8px]"
          enterTo="opacity-100 translate-y-0"
          leave="transition-opacity-translate duration-200"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-[-8px]"
        >
          <hr className="my-3 block h-[0.5] w-full bg-gray-6" />
          <div className="flex items-center justify-between">
            <ReviewScopeMenu scope={scope} setScope={setScope} />
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={false}
              className="group flex h-8 items-center justify-center self-end rounded-full p-4 font-bold text-white shadow-4 transition-all duration-150 active:translate-y-0 active:shadow-none enabled:bg-rally-gradient enabled:hover:translate-y-[-2px] enabled:hover:shadow-5 disabled:bg-gray-4 disabled:shadow-none"
            >
              {buttonText}
              <div className="ml-1 transition-transform group-hover:translate-y-0">
                <ArrowRight size={16} weight="bold" color="white" />
              </div>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  );
}

function CustomReviewForm({
  onSubmit,
  firstExample,
  buttonText,
}: {
  onSubmit: (
    lens: ReviewLens,
    scope: ReviewScope,
    instruction?: string,
    includedRevisionTypes?: RevisionType[],
    playbook?: Playbook,
  ) => void;
  firstExample?: boolean;
  buttonText: string;
}) {
  const { trackEvent } = useAnalytics();
  const {
    reviewLensState: {
      lens: customLens,
      instruction: customInstruction,
      includedRevisionTypes: customRevisionTypes,
      playbook,
    },
    updateReviewLens,
  } = useReview();

  enum SuggestionType {
    modification = 'Redlines',
    comment = 'Comments',
    both = 'Any',
  }

  function getRevisionTypes(suggestionType: SuggestionType) {
    switch (suggestionType) {
      case SuggestionType.both:
        return [RevisionType.comment, RevisionType.modification];
      case SuggestionType.comment:
        return [RevisionType.comment];
      case SuggestionType.modification:
        return [RevisionType.modification];
      default:
        return [RevisionType.comment, RevisionType.modification];
    }
  }

  const memoizedGetRevisionTypes = useCallback(getRevisionTypes, [
    SuggestionType.both,
    SuggestionType.comment,
    SuggestionType.modification,
  ]);

  function getSuggestionType(revisionTypes: RevisionType[] | undefined) {
    if (
      revisionTypes?.includes(RevisionType.comment) &&
      revisionTypes?.includes(RevisionType.modification)
    ) {
      return SuggestionType.both;
    }
    if (revisionTypes?.includes(RevisionType.comment)) {
      return SuggestionType.comment;
    }
    if (revisionTypes?.includes(RevisionType.modification)) {
      return SuggestionType.modification;
    }
    return SuggestionType.both;
  }

  const { fetchPlaybooks, isPlaybooksLoading, setIsPlaybookDrawerOpen } =
    usePlaybook();
  const isPlaybooksEnabled = useFeatureToggle('playbooks');
  const isPlaybooksCardEnabled = useFeatureToggle('playbooksCard');

  const [currentExample, setCurrentExample] = useState(
    firstExample ? 0 : getRandomInt(0, CUSTOM_PROMPT_EXAMPLES.length),
  );
  const [isDisabled, setIsDisabled] = useState(false);
  const [scope, setScope] = useState(ReviewScope.document);

  const { register, handleSubmit, watch, setValue, control } = useForm({
    defaultValues: {
      instruction: customInstruction ?? '',
      suggestionType:
        getSuggestionType(customRevisionTypes) ?? SuggestionType.both,
    },
  });

  const instructionValue = watch('instruction');
  const suggestionType = watch('suggestionType');

  const onCustomSubmit = useCallback(
    ({ instruction, suggestionType: suggestionCallbackType }) => {
      onSubmit(
        customLens,
        scope,
        instruction,
        memoizedGetRevisionTypes(suggestionCallbackType),
        playbook,
      );
    },
    [customLens, onSubmit, scope, memoizedGetRevisionTypes, playbook],
  );

  useEffect(() => {
    setValue('instruction', customInstruction ?? '');
  }, [customInstruction, setValue]);

  useEffect(() => {
    updateReviewLens({
      lens: ReviewLens.Custom,
      instruction: instructionValue,
      includedRevisionTypes: memoizedGetRevisionTypes(suggestionType),
      playbook,
    });
  }, [
    instructionValue,
    suggestionType,
    setValue,
    updateReviewLens,
    memoizedGetRevisionTypes,
    playbook,
  ]);

  useEffect(() => {
    setIsDisabled(
      !instructionValue.trim() || instructionValue.length > INSTRUCTION_LIMIT,
    );
  }, [instructionValue]);

  const revisionTypes = [
    {
      value: SuggestionType.both,
      label: 'Any',
      props: register('suggestionType'),
    },
    {
      value: SuggestionType.comment,
      label: 'Comments',
      props: register('suggestionType'),
    },
    {
      value: SuggestionType.modification,
      label: 'Redlines',
      props: register('suggestionType'),
    },
  ];

  return (
    <>
      <hr className="my-3 block h-[0.5] w-full bg-gray-6" />
      <div className="mb-2 flex flex-col">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-bold text-black">
            Example Prompt
            <button
              type="button"
              onClick={() => {
                setCurrentExample(
                  (currentExample + 1) % CUSTOM_PROMPT_EXAMPLES.length,
                );
              }}
              title="Regenerate"
              className="ml-2 text-purple-1"
            >
              <FontAwesomeIcon icon={faArrowsRotate} />
            </button>
          </p>
          {isPlaybooksEnabled && !isPlaybooksCardEnabled && (
            <button
              type="button"
              className="flex items-center space-x-1 self-end rounded bg-blue-2 px-2 py-1 text-xs font-bold text-white"
              onClick={async () => {
                await fetchPlaybooks();
                if (!isPlaybooksLoading) {
                  trackEvent('View Playbooks', {
                    source: 'Custom Review Card',
                  });
                  setIsPlaybookDrawerOpen(true);
                }
              }}
            >
              <span>Playbooks</span>
              {isPlaybooksLoading && (
                <LoadingSpinner color="white" variant="small" />
              )}
            </button>
          )}
        </div>
        <p className="mb-2 italic leading-5 text-gray-2">
          {CUSTOM_PROMPT_EXAMPLES[currentExample]}
        </p>
      </div>
      <form
        className="flex w-full flex-col"
        onSubmit={handleSubmit(onCustomSubmit)}
      >
        <div className="h-24 rounded-lg border border-gray-5 p-2 pr-1 focus-within:border-blue-1">
          <textarea
            className="h-full w-full resize-none text-sm outline-none"
            placeholder="Be specific and verbose. The more detail you provide, the better the results."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isDisabled) {
                e.preventDefault();
                handleSubmit(onCustomSubmit)();
              }
            }}
            {...register('instruction', {
              required: true,
              validate: (v) => !!v?.trim(),
            })}
            /* eslint-disable-next-line jsx-a11y/no-autofocus */
            autoFocus
          />
          {instructionValue.length > 0 && (
            <div className="mt-2 flex justify-end gap-1.5 text-right text-xs">
              <div className="text-gray-2">
                {instructionValue.length}/{INSTRUCTION_LIMIT}
              </div>
              <ProgressRing
                percent={Math.min(
                  (instructionValue.length / INSTRUCTION_LIMIT) * 100,
                  100,
                )}
                error={instructionValue.length > INSTRUCTION_LIMIT}
                size={14}
                strokeWidth={2}
              />
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="flex space-x-2">
            <ReviewScopeMenu scope={scope} setScope={setScope} />
            <div>
              <Controller
                name="suggestionType"
                control={control}
                defaultValue={SuggestionType.both}
                render={({ field }) => (
                  <Dropdown
                    label="Suggestions"
                    value={field.value}
                    onChange={(e: SuggestionType) =>
                      setValue('suggestionType', e)
                    }
                  >
                    {revisionTypes.map(({ value, label, ...props }) => (
                      <Dropdown.Item
                        key={value}
                        label={label}
                        value={value}
                        {...props}
                      />
                    ))}
                  </Dropdown>
                )}
              />
            </div>
          </div>
          <hr className="my-3 block h-[0.5] w-full bg-gray-6" />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isDisabled}
              className="group flex h-8 items-center justify-center self-end rounded-full p-4 font-bold text-white shadow-4 transition-all duration-150 active:translate-y-0 active:shadow-none enabled:bg-rally-gradient enabled:hover:translate-y-[-2px] enabled:hover:shadow-5 disabled:bg-gray-4 disabled:shadow-none"
            >
              {buttonText}
              <div className="ml-1 transition-transform group-hover:translate-y-0">
                <ArrowRight size={16} weight="bold" color="white" />
              </div>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

export function CustomReviewCard({
  lens: { label, icon, hoverIcon, description, buttonText },
  onSubmit,
  defaultOpen,
  firstExample,
}: {
  lens: {
    label: string;
    icon: string;
    hoverIcon: string;
    description: string;
    buttonText: string;
  };
  onSubmit: (
    lens: ReviewLens,
    scope: ReviewScope,
    instruction?: string,
    includedRevisionTypes?: RevisionType[],
  ) => void;
  defaultOpen?: boolean;
  firstExample?: boolean;
}) {
  const { activeReviewLens, setActiveReviewLens } = useReview();
  const isCustomFormOpen = activeReviewLens === ReviewLens.Custom;

  const cardRef = useRef<HTMLDivElement | null>(null);
  const cardParentRef = useRef<HTMLDivElement | null>(null);
  const isFormExpanded = isCustomFormOpen || defaultOpen;

  const handleOutsideClick = useCallback(
    (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setActiveReviewLens(null);
      }
    },
    [setActiveReviewLens],
  );

  useEffect(() => {
    if (isFormExpanded) {
      document.addEventListener('click', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [defaultOpen, handleOutsideClick, isFormExpanded, isCustomFormOpen]);

  return (
    <div className="mx-4 w-11/12 max-w-md pb-12" ref={cardParentRef}>
      <div
        className={`group rounded-[14px] bg-gray-5 p-0.5 transition-all duration-75 hover:cursor-pointer hover:bg-gradient-to-br hover:from-blue-1 hover:to-purple-1 hover:shadow-6 ${
          isFormExpanded
            ? 'bg-gradient-to-br from-blue-1 to-purple-1 shadow-6'
            : 'hover:-translate-y-px'
        }`}
      >
        <div
          ref={cardRef}
          role="button"
          tabIndex={0}
          className={`relative grid w-full grid-cols-[auto_1fr] grid-rows-[auto_1fr] items-center gap-x-4 gap-y-1 rounded-xl bg-white px-4 py-3
        ${isFormExpanded ? 'cursor-default' : ''}
        `}
          onClick={() => {
            setActiveReviewLens(ReviewLens.Custom);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setActiveReviewLens(null);
            }
          }}
        >
          <div className="col-span-1 row-span-3 flex items-center justify-center">
            <img
              className={`h-10 w-10 group-hover:opacity-0 group-hover:transition-all group-hover:duration-75
            ${isFormExpanded ? 'opacity-0' : ''}
            `}
              src={`${icon}`}
              alt={`${label} icon`}
            />
            <img
              className={`absolute left-4 h-10 w-10 opacity-0 group-hover:opacity-100 group-hover:transition-all group-hover:duration-75
              ${isFormExpanded ? 'opacity-100 transition-all duration-75' : ''}
            `}
              src={hoverIcon}
              alt={`${label} icon`}
            />
          </div>
          <h4 className="col-span-1 font-bold">{label}</h4>
          <p className="col-span-2 col-start-2 row-span-2 leading-[1.15rem] text-gray-2">
            {description}
          </p>
          <div className="col-start-3 row-start-1 rounded-full bg-gray-6 px-3 py-1 text-xs text-gray-2">
            Experimental
          </div>
          <Transition
            show={!!isFormExpanded}
            className="col-span-3"
            enter="transition-opacity-translate duration-200"
            enterFrom="opacity-0 translate-y-[-8px]"
            enterTo="opacity-100 translate-y-0"
            leave="transition-opacity-translate duration-200"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-[-8px]"
            afterEnter={() =>
              cardParentRef.current?.scrollIntoView({
                block: 'end',
                behavior: 'smooth',
              })
            }
          >
            <CustomReviewForm
              onSubmit={onSubmit}
              firstExample={firstExample}
              buttonText={buttonText}
            />
          </Transition>
        </div>
      </div>
    </div>
  );
}

export function ReviewLensMenu() {
  const { trackEvent } = useAnalytics();
  const { generateReviewItems, updateReviewLens } = useReview();
  const isPlaybooksEnabled = useFeatureToggle('playbooks');
  const isPlaybooksCardEnabled = useFeatureToggle('playbooksCard');

  const reviewCallback = useDebouncedCallback(
    async (
      lens: ReviewLens = ReviewLens.General,
      scope: ReviewScope = ReviewScope.document,
      instruction?: string,
      includedRevisionTypes?: RevisionType[],
      playbook?: Playbook,
    ) => {
      trackEvent('Start Review', {
        lens,
        scope,
        ...(lens === ReviewLens.Custom || lens === ReviewLens.Playbooks
          ? { includedRevisionTypes }
          : {}),
      });

      updateReviewLens({
        lens,
        scope,
        instruction,
        includedRevisionTypes,
        playbook,
      });
      await generateReviewItems(
        lens,
        scope,
        instruction,
        includedRevisionTypes,
      );
    },
    100,
    { leading: true, trailing: false },
  );

  return (
    <div className="mt-2 flex w-full flex-col items-center">
      {Object.values(ReviewLens)
        .filter(
          (lens) =>
            lens !== ReviewLens.Playbooks ||
            (isPlaybooksEnabled && isPlaybooksCardEnabled),
        )
        .map((lens) =>
          lens === ReviewLens.Custom ? (
            <CustomReviewCard
              key={lens}
              lens={getReviewLens(lens)}
              onSubmit={reviewCallback}
            />
          ) : (
            <ReviewCard
              key={lens}
              lens={getReviewLens(lens)}
              onSubmit={reviewCallback}
            />
          ),
        )}
      <PlaybookDrawer />
    </div>
  );
}
