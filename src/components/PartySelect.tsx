import { useEffect, useRef, useState } from 'react';
import {
  faPeopleArrows,
  faSpinner,
} from '@fortawesome/sharp-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCombobox } from 'downshift';
import { useDocumentData } from '../contexts/DocumentDataContext';
import { Party } from '../types/Party';
import { useAnalytics } from '../contexts/AnalyticsContext';

function getItems(parties: Party[], inputValue?: string): Party[] {
  const items = (
    inputValue?.trim()
      ? parties?.filter((party) =>
          party.name.match(
            new RegExp(inputValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
          ),
        )
      : [...parties]
  )?.filter(
    (item, index, self) =>
      self.findIndex((party) => party.name === item.name) === index,
  );

  items.sort((a, b) => a.name.localeCompare(b.name));

  if (inputValue?.trim() && !items?.find((item) => item.name === inputValue)) {
    items.push({ name: inputValue });
  }

  return items;
}

function PartySelectCombobox({
  setShowCombobox,
}: {
  setShowCombobox: (showCombobox: boolean) => void;
}) {
  const { trackEvent } = useAnalytics();
  const {
    documentData: { parties = [], representedParty },
    updateDocumentData,
    status: { partiesLoading },
  } = useDocumentData();
  const [items, setItems] = useState<Party[]>(getItems(parties));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (parties?.length) {
      setItems(getItems(parties));
    }
  }, [parties, representedParty]);

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    getToggleButtonProps,
    setInputValue,
    selectItem,
  } = useCombobox({
    items,
    defaultHighlightedIndex: 0,
    initialSelectedItem: representedParty,
    itemToString: (item) => (item ? item.name : ''),
    onInputValueChange: ({ inputValue }) => {
      setItems(getItems(parties, inputValue));
    },
    onSelectedItemChange: ({ selectedItem }) => {
      trackEvent('Select Represented Party', {
        custom: !!parties.find((party) => party.name === selectedItem?.name),
      });
      updateDocumentData({
        representedParty: selectedItem || undefined,
      });
      inputRef.current?.blur();
    },
    onIsOpenChange: (changes) => {
      if (changes.isOpen) {
        setItems(getItems(parties));
      }

      if (!changes.isOpen && !!changes.inputValue) {
        setInputValue(changes.selectedItem?.name ?? '');
      }

      if (!changes.isOpen) {
        inputRef.current?.blur();
      }
    },
  });

  useEffect(() => {
    if (representedParty) {
      selectItem(representedParty);
    }
  }, [representedParty, selectItem]);

  return (
    <div className="flex w-full items-center">
      <span className="mr-1 text-gray-2">Representing</span>
      <div className={`relative grow ${!isOpen ? 'truncate' : 'z-10'}`}>
        {!isOpen && !!representedParty?.name?.length && (
          <span
            {...getToggleButtonProps()}
            className="cursor-pointer border-none bg-white px-[0.5px] text-purple-1 underline underline-offset-2"
          >
            {representedParty.name}
          </span>
        )}
        <input
          title={representedParty?.name}
          className={`w-full rounded-[4px] border border-gray-4 px-2 py-1 leading-4 outline-none
          ${
            isOpen || !representedParty?.name?.length
              ? 'rounded-b-none rounded-t-[2px] border-b-0 bg-gray-base'
              : 'hidden'
          }
          ${!items?.length && 'border-b-[1px]'}
          `}
          placeholder="Select or enter party"
          spellCheck={false}
          {...getInputProps({
            ref: inputRef,
            autoFocus: !representedParty,
            onBlur: (event) => {
              if (event.target.value === '') {
                updateDocumentData({ representedParty: undefined });
                setShowCombobox(false);
              }
            },
          })}
        />
        <ul
          className={`absolute max-h-[200px] w-full overflow-y-auto rounded-b-[4px] bg-white p-1 pt-0 ${
            isOpen ? 'border border-t-0 border-gray-4' : 'hidden'
          }`}
          {...getMenuProps()}
        >
          <li className="items-center p-1 text-sm text-gray-3">
            <em>Select a party to represent</em>
          </li>
          {partiesLoading && (
            <li className="items-center p-1 text-sm text-gray-3">
              <FontAwesomeIcon className="mr-1" icon={faSpinner} spinPulse />
              Loading parties
            </li>
          )}
          {items?.map((item, index) => (
            <li
              key={item.name}
              className={`${
                highlightedIndex === index
                  ? 'cursor-pointer rounded-[4px] bg-gray-6'
                  : ''
              } break-words p-2 leading-4`}
              {...getItemProps({ item, index })}
            >
              {item.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PartySelect() {
  const {
    documentData: { representedParty },
  } = useDocumentData();
  const [showCombobox, setShowCombobox] = useState(!!representedParty);

  useEffect(() => {
    setShowCombobox(!!representedParty);
  }, [representedParty]);

  return (
    <div className="mx-2 flex h-10 flex-none items-center justify-start">
      {showCombobox ? (
        <PartySelectCombobox setShowCombobox={setShowCombobox} />
      ) : (
        <button
          type="button"
          className="flex cursor-pointer items-center justify-start text-purple-1"
          onClick={() => {
            setShowCombobox(true);
          }}
        >
          <FontAwesomeIcon className="mr-1 text-xs" icon={faPeopleArrows} />
          Select Represented Party
        </button>
      )}
    </div>
  );
}
