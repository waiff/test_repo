import './styles/omnibox.css';

import {
  faArrowsToLine,
  faBookSparkles,
  faCalendarWeek,
  faCloudWord,
  faCode,
  faEnvelopeOpenText,
  faHammerCrash,
  faHandshakeSimple,
  faLock,
  faMemoPad,
  faPen,
  faPenLine,
  faPenSwirl,
  faSparkles,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faAngleLeft,
  faAngleRight,
  faCircleXmark,
  faSend,
  faWandMagicSparkles,
} from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCombobox } from 'downshift';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSubscribe } from 'use-pubsub-js';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import TextareaAutosize from 'react-textarea-autosize';
import {
  fakDiamond,
  fakELI25,
  fakELI5,
  fakListParties,
  fakMissingBoilerplate,
  fakMissingClauses,
  fakUnusualTerms,
} from '../icons/fakSpellIcons';

import { SpellOption } from '../common/SpellOption';
import { SpellPromptCollector } from '../common/SpellPromptCollector';
import { SpellSource } from '../common/SpellSource';
import { SpellEvents } from '../common/SpellEvents';
import { useSpellbook } from '../contexts/SpellbookContext';
import { useDocumentData } from '../contexts/DocumentDataContext';
import { useChat } from '../hooks/useChat';
import { useDevelopmentSpells } from '../hooks/useDevelopmentSpells';
import { useMessage } from '../hooks/useMessage';
import { useSelection } from '../hooks/useSelection';
import { useSpellList } from '../hooks/useSpellList';
import { handleException } from '../utils/ErrorUtils';
import { ResendAction } from './ResendAction';
import { COLORS } from './Styles';
import { Tag } from './Tag';
import { MessageType } from '../types/ChatMessage';

const DRAFT_SPELLS = [
  'draft',
  'quick draft',
  'directed draft',
  'rewrite',
  'autocomplete',
  'autocomplete with instructions',
  'draft from precedent',
];

const PROMOTED_SPELLS = [
  'Explain Section',
  'Missing Clauses',
  'Write a Review Email',
];

const Icons = {
  faArrowsToLine,
  faBookSparkles,
  faCalendarWeek,
  faCloudWord,
  faCode,
  faEnvelopeOpenText,
  faHammerCrash,
  faHandshakeSimple,
  faLock,
  faMemoPad,
  faPen,
  faPenLine,
  faPenSwirl,
  faSparkles,
};

const CustomIcons = {
  fakDiamond,
  fakELI25,
  fakELI5,
  fakListParties,
  fakMissingBoilerplate,
  fakMissingClauses,
  fakUnusualTerms,
};

const sortReviewSpells = (a: SpellOption, b: SpellOption) => {
  const aIdx = PROMOTED_SPELLS.indexOf(a.label);
  const bIdx = PROMOTED_SPELLS.indexOf(b.label);
  if (aIdx !== -1 && bIdx !== -1) {
    return aIdx - bIdx;
  }
  if (aIdx !== -1) {
    return -1;
  }
  if (bIdx !== -1) {
    return 1;
  }
  return a.label.localeCompare(b.label);
};

function SpellItem({
  spell,
  selected,
  index,
  getItemProps,
  disabled,
}: {
  spell: SpellOption;
  selected: boolean;
  index: number;
  getItemProps: any;
  disabled: boolean;
}) {
  const { key, label, icon, helpText, tags, children } = spell;

  const spellIcon = icon
    ? Icons[icon as keyof typeof Icons] ||
      CustomIcons[icon as keyof typeof CustomIcons]
    : faSparkles;

  const isBack = key === 'back';
  return (
    <div
      className={`spell-option m-1 flex cursor-pointer items-center rounded p-2 ${
        selected ? 'selected' : ''
      }`}
      // FIX-Me
      // eslint-disable-next-line jsx-a11y/role-has-required-aria-props
      role="option"
      title={helpText}
      {...getItemProps({
        item: spell,
        index,
      })}
    >
      <div className="mr-2 flex w-6 justify-center">
        <FontAwesomeIcon
          icon={isBack ? faAngleLeft : (spellIcon as IconProp)}
          className={`${isBack || disabled ? 'text-gray-3' : 'text-purple-1'} ${
            icon === 'faArrowsToLine' ? 'rotate-90' : ''
          } 
          w-[18px]
          text-[18px]
          `}
        />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyItems: 'center',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              color: disabled ? COLORS.MEDIUM_GRAY : undefined,
            }}
          >
            {label}
          </div>
          <div>
            {tags?.map((tag) => (
              <Tag key={tag} tag={tag} />
            ))}
          </div>
        </div>
      </div>
      {children?.length && (
        <FontAwesomeIcon
          icon={faAngleRight}
          style={{
            marginLeft: 'auto',
            fontSize: '18px',
            color: COLORS.DARK_GRAY,
          }}
        />
      )}
    </div>
  );
}

function CancelPromptButton({
  promptCollector,
}: {
  promptCollector: SpellPromptCollector;
}) {
  const { onCancel, cancelTooltip } = promptCollector;
  return (
    <FontAwesomeIcon
      icon={faCircleXmark}
      onClick={onCancel}
      title={cancelTooltip}
      style={{
        color: COLORS.DARK_GRAY,
        cursor: 'pointer',
        fontSize: '30px',
      }}
    />
  );
}

function CastButton({ ...props }) {
  return (
    <FontAwesomeIcon
      icon={faWandMagicSparkles}
      title="Cast Spell"
      style={{
        color: COLORS.BLUE,
        fontSize: '20px',
        cursor: 'pointer',
      }}
      {...props}
    />
  );
}

function SubmitButton({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (event: any) => void;
}) {
  return (
    <FontAwesomeIcon
      icon={faSend}
      title="Submit Question"
      onClick={(event) => (disabled ? () => {} : onSubmit(event))}
      className={`z-10 text-xl ${
        disabled ? 'cursor-auto text-gray-3' : 'cursor-pointer text-blue-1'
      }`}
    />
  );
}

type SpellGroup = {
  title?: string;
  spells: SpellOption[];
};

export function Omnibox() {
  const {
    lastSpellName,
    recastLastSpell,
    setDebugEnabled,
    isDebugEnabled,
    setChatAction,
    boxValue,
    setBoxValue,
    promptCollector,
  } = useSpellbook();
  const { documentData } = useDocumentData();
  const message = useMessage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [filteredSpells, setFilteredSpells] = useState<SpellOption[]>([]);
  const [filteredGroupedSpells, setFilteredGroupedSpells] = useState<
    SpellGroup[]
  >([]);
  const [flattenedFilteredGroupedSpells, setFlattenedFilteredGroupedSpells] =
    useState<SpellOption[]>([]);
  const { refreshDocumentState } = useSelection();
  const isChatDisabled = boxValue.trim().length === 0;

  const focusInput = useCallback(() => {
    inputRef?.current?.focus();
  }, [inputRef]);
  const { spells, summonSpells } = useSpellList({
    focusInput,
  });

  useSubscribe({
    token: SpellEvents.FocusInput,
    handler: focusInput,
  });

  const developmentSpells = useDevelopmentSpells();
  const { insertBotMessage } = useChat();
  // @ts-ignore  FIX-ME
  const [selectedCategory, setSelectedCategory] = useState<SpellOption>(null);

  // @ts-ignore  FIX-ME
  function stateReducer(state, actionAndChanges) {
    const { type, changes } = actionAndChanges;
    switch (type) {
      case useCombobox.stateChangeTypes.FunctionCloseMenu:
      case useCombobox.stateChangeTypes.FunctionReset:
        if (selectedCategory) {
          // @ts-ignore  FIX-ME
          // don't want the items to change until after the close is finished animating
          setTimeout(() => setSelectedCategory(null), 200);
        }
        if (state.inputValue === '') {
          setBoxValue('');
        }
        return changes;
      case useCombobox.stateChangeTypes.InputKeyDownEnter:
      case useCombobox.stateChangeTypes.ItemClick:
        if (changes?.selectedItem?.children?.length) {
          setSelectedCategory(changes.selectedItem);
          return {
            ...changes,
            selectedItem: null,
            inputValue: state.inputValue,
            isOpen: true,
          };
        }
        if (changes.selectedItem.key === 'back') {
          // @ts-ignore  FIX-ME
          setSelectedCategory(null);
          return {
            ...changes,
            selectedItem: null,
            inputValue: state.inputValue,
            isOpen: true,
          };
        }
        break;
      default:
        return changes;
    }
    return changes;
  }

  const handleInputValueChange = useCallback(
    (value: string) => {
      setBoxValue(value);
    },
    [setBoxValue],
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

  const flattenGroupOptions = (spellGroups: SpellGroup[]) =>
    // @ts-ignore  FIX-ME
    spellGroups.reduce((prev, curr) => [...prev, ...curr.spells], []);

  const buildSpellTree = (treeSpells: any[]) => {
    // @ts-ignore  FIX-ME
    const spellTree = [];
    treeSpells.forEach((spell) => {
      if (spell?.categories?.length) {
        const categoryId = spell.categories[0]._id;
        const categoryName = spell.categories[0].name;
        const categoryIcon = spell.categories[0].icon;
        // @ts-ignore  FIX-ME
        const existingCategory = spellTree.find(
          (option) => option.categoryId === categoryId,
        );
        if (existingCategory) {
          existingCategory.children.push(spell);
        } else {
          spellTree.push({
            key: categoryId,
            categoryId,
            label: categoryName,
            children: [spell],
            icon: categoryIcon,
          });
        }
      } else {
        spellTree.push(spell);
      }
    });
    // @ts-ignore  FIX-ME
    return spellTree;
  };

  const {
    isOpen,
    openMenu,
    reset,
    getMenuProps,
    getInputProps,
    getItemProps,
    getToggleButtonProps,
    highlightedIndex,
  } = useCombobox({
    stateReducer,
    defaultHighlightedIndex: 0,
    items: flattenedFilteredGroupedSpells,
    itemToString: (item) => (item ? item.label : ''),
    onSelectedItemChange: ({ selectedItem }) => {
      reset();
      // @ts-ignore  FIX-ME
      selectedItem?.action({ source: SpellSource.SpellSelector });
      // @ts-ignore  FIX-ME
      setSelectedCategory(null);
    },
    onIsOpenChange: (event) => {
      if (event.isOpen) {
        summonSpells()
          .then(() => console.log('spells refreshed'))
          .catch((error) => handleException(error));
      }
      refreshDocumentState();
    },
  });

  useEffect(() => {
    if (selectedCategory) {
      // @ts-ignore  FIX-ME
      const newFilteredSpells = selectedCategory.children.filter((spell) =>
        spell.label.toLowerCase().includes(boxValue.toLowerCase()),
      );
      const newFilteredGroupSpells: SpellGroup[] = [
        {
          spells: [
            {
              key: 'back',
              label: selectedCategory.label,
            },
          ],
        },
        {
          spells: newFilteredSpells,
        },
      ];
      setFilteredGroupedSpells(newFilteredGroupSpells);
      setFlattenedFilteredGroupedSpells(
        // @ts-ignore  FIX-ME
        flattenGroupOptions(newFilteredGroupSpells),
      );
      setFilteredSpells(newFilteredSpells);
    } else if (spells?.length) {
      const spellList = boxValue !== '' ? spells : buildSpellTree(spells);
      const filteredDevSpells = developmentSpells.filter(({ label }) =>
        // @ts-ignore  FIX-ME
        label.toLowerCase().includes(boxValue.toLowerCase()),
      );
      const draftSpells = spellList.filter(
        ({ label }) =>
          DRAFT_SPELLS.includes(label.toLowerCase()) &&
          label.toLowerCase().includes(boxValue.toLowerCase()),
      );
      const reviewSpells = spellList.filter(
        ({ label }) =>
          !DRAFT_SPELLS.includes(label.toLowerCase()) &&
          label.toLowerCase().includes(boxValue.toLowerCase()),
      );
      reviewSpells.sort(sortReviewSpells);
      const newFilteredGroupSpells: SpellGroup[] = [
        {
          title: 'Draft',
          spells: draftSpells,
        },
        {
          title: 'Review',
          spells: reviewSpells,
        },
        ...(filteredDevSpells.length
          ? [{ title: 'Development Spells', spells: filteredDevSpells }]
          : []),
      ];
      const newFilteredSpells = spellList.filter((spell) =>
        spell.label.toLowerCase().includes(boxValue.toLowerCase()),
      );
      setFilteredGroupedSpells(newFilteredGroupSpells);
      setFlattenedFilteredGroupedSpells(
        // @ts-ignore  FIX-ME
        flattenGroupOptions(newFilteredGroupSpells),
      );
      setFilteredSpells(newFilteredSpells);
    }
  }, [spells, selectedCategory, boxValue, developmentSpells]);

  useEffect(() => {
    if (lastSpellName && recastLastSpell) {
      setChatAction(
        <ResendAction
          label={`Cast ${lastSpellName} again`}
          onClick={recastLastSpell}
        />,
      );
    } else {
      setChatAction(null);
    }
  }, [lastSpellName, recastLastSpell, setChatAction]);

  const onSubmit = useCallback(
    (event) => {
      event.preventDefault();

      if (isChatDisabled) {
        return;
      }

      reset();

      if (boxValue.toLowerCase() === 'toggle debug') {
        setDebugEnabled(!isDebugEnabled);
        return;
      }

      if (boxValue.toLowerCase() === 'print document data') {
        insertBotMessage(
          JSON.stringify(documentData, null, 2),
          MessageType.ASSISTANT_RESPONSE,
          `document-data-${Date.now()}`,
          'none',
        );
        return;
      }

      if (promptCollector) {
        promptCollector.onRespond(boxValue);
        return;
      }

      message(boxValue);
    },
    [
      boxValue,
      message,
      reset,
      isChatDisabled,
      promptCollector,
      isDebugEnabled,
      setDebugEnabled,
      documentData,
      insertBotMessage,
    ],
  );

  const castSelectedSpell = useCallback(
    (event: any) => {
      event.preventDefault();
      if (highlightedIndex >= 0) {
        reset();
        // @ts-ignore  FIX-ME
        flattenedFilteredGroupedSpells[highlightedIndex].action({
          source: SpellSource.SpellSelector,
        });
      }
    },
    [reset, highlightedIndex, flattenedFilteredGroupedSpells],
  );

  const expanded = isOpen && filteredSpells.length > 0 && !promptCollector;
  const showCastButton =
    highlightedIndex >= 0 &&
    expanded &&
    !!flattenedFilteredGroupedSpells?.[highlightedIndex]?.action;
  const showSubmitButton =
    boxValue.length &&
    (flattenedFilteredGroupedSpells.length === 0 ||
      (selectedCategory && flattenedFilteredGroupedSpells.length === 1));

  return (
    <div style={{ margin: '8px', position: 'relative' }}>
      <div
        className={`spell-selector-container ${
          expanded ? 'expanded' : 'collapsed'
        }`}
        {...getMenuProps()}
      >
        <div
          className={`spell-selector w-full items-center justify-center bg-white ${
            expanded ? 'expanded' : 'collapsed'
          }`}
        >
          {
            filteredGroupedSpells.reduce(
              (result, section, sectionIndex) => {
                result.sections.push(
                  // @ts-ignore  FIX-ME
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={sectionIndex}>
                    {(!boxValue.length || selectedCategory) &&
                      filteredGroupedSpells.length > 1 &&
                      sectionIndex > 0 && (
                        <div className="my-1">
                          <hr className="h-[0.5px] border-0 bg-gray-3" />
                        </div>
                      )}
                    {!boxValue.length && section.title && (
                      <div
                        style={{
                          padding: '6px 12px',
                          background: COLORS.WHITE,
                          color: COLORS.DARK_GRAY,
                        }}
                      >
                        {section.title}
                      </div>
                    )}
                    {section.spells.map((spell) => {
                      // FIX-ME
                      // eslint-disable-next-line no-param-reassign,no-plusplus
                      const index = result.itemIndex++;
                      return (
                        <SpellItem
                          key={spell.key}
                          spell={spell}
                          selected={highlightedIndex === index}
                          index={index}
                          getItemProps={getItemProps}
                          // @ts-ignore  FIX-ME
                          disabled={spell.disabled}
                        />
                      );
                    })}
                  </div>,
                );
                return result;
              },
              { sections: [], itemIndex: 0 },
            ).sections
          }
        </div>
      </div>
      <form onSubmit={onSubmit}>
        <div
          className={`omnibox relative box-border flex w-full items-center justify-between rounded-[22px] px-2 ${
            expanded ? 'expanded' : 'collapsed'
          }`}
        >
          {promptCollector ? (
            <CancelPromptButton promptCollector={promptCollector} />
          ) : (
            <button
              type="button"
              title="Select Spell"
              disabled={filteredSpells.length === 0}
              className={`text-[30px] ${
                filteredSpells.length === 0 ? 'text-gray-3' : 'text-purple-1'
              }`}
              {...getToggleButtonProps()}
            >
              <FontAwesomeIcon icon={CustomIcons.fakDiamond as IconProp} />
            </button>
          )}
          <div className="mr-1 flex grow py-2 align-middle">
            <TextareaAutosize
              maxRows={3}
              placeholder={
                promptCollector
                  ? promptCollector.promptText
                  : 'Select Spell or Ask a Question...'
              }
              className="w-full resize-none px-2 text-[15px] leading-[26px] outline-none"
              spellCheck={false}
              {...getInputProps({
                ref: (tag: HTMLInputElement) => {
                  inputRef.current = tag;
                },
                value: boxValue,
                onClick: openMenu,
                onKeyDown(event) {
                  if (
                    !expanded &&
                    (event.key === 'ArrowUp' || event.key === 'ArrowDown')
                  ) {
                    // eslint-disable-next-line no-param-reassign
                    (event as any).preventDownshiftDefault = true;
                  }
                  if (event.key === 'Enter') {
                    if (event.shiftKey) {
                      // @ts-ignore
                      // eslint-disable-next-line no-param-reassign
                      event.preventDownshiftDefault = true;
                    } else if (
                      !expanded ||
                      filteredSpells?.length === 0 ||
                      highlightedIndex === null
                    ) {
                      // @ts-ignore
                      // eslint-disable-next-line no-param-reassign
                      event.preventDownshiftDefault = true;
                      event.preventDefault();
                      if (!!boxValue && !expanded) {
                        onSubmit(event);
                      }
                    }
                  }
                  if (event.key === 'Escape') {
                    reset();
                    if (promptCollector) {
                      promptCollector.onCancel();
                    }
                  }
                },
              })}
              onChange={handleNativeChangeEvent}
            />
          </div>
          <div className="w-6">
            {/* eslint-disable-next-line no-nested-ternary */}
            {showCastButton ? (
              <CastButton onMouseDown={castSelectedSpell} />
            ) : showSubmitButton ? (
              <SubmitButton disabled={isChatDisabled} onSubmit={onSubmit} />
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
