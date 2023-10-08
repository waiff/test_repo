import { useCallback, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport } from '@fortawesome/pro-regular-svg-icons';
import { CaretDown } from '@phosphor-icons/react';
import {
  IconDefinition,
  faArrowRightFromBracket,
  faXmark,
} from '@fortawesome/sharp-solid-svg-icons';
import { Menu, Transition } from '@headlessui/react';
import { useDebouncedCallback } from 'use-debounce';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';

import { useReview } from '../contexts/ReviewContext';
import type {
  ModificationReviewItem,
  ReviewItem as ReviewItemDto,
} from '../types/ReviewItem';

import { RevisionType } from '../services/RallyApiService';
import { useDocument } from '../contexts/DocumentContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { DiffType, diffText } from '../utils/diffText';
import { ClickAwayListener } from './ClickAwayListener';
import { BasicTooltip } from './tooltip/Tooltip';

const LINE_COLORS = {
  [RevisionType.comment]: 'border-b-[#56A1F8]',
  [RevisionType.modification]: 'border-b-[#FED544]',
};

function getChangeColor(diffType: DiffType) {
  switch (diffType) {
    case DiffType.insert: {
      return 'bg-green-100';
    }
    case DiffType.delete: {
      return 'bg-red-100 line-through';
    }
    case DiffType.equal:
    default: {
      return 'text-slate-900';
    }
  }
}

function ModificationBody({
  reviewItem,
  isFocused,
  setIsFocused,
}: {
  reviewItem: ModificationReviewItem;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
}) {
  const { trackEvent } = useAnalytics();
  const { updateReviewItem } = useReview();
  const { reason, diff, text, paragraph } = reviewItem;
  const editedText = useRef<string>(text);
  const onChange = (event: ContentEditableEvent) => {
    editedText.current = event.target.value;
  };

  const onBlur = useCallback(() => {
    setIsFocused(false);
    if (editedText.current !== text) {
      trackEvent('Edited Review Item', { origin });
      const newDiff = diffText(paragraph, editedText.current);
      updateReviewItem(reviewItem, { text: editedText.current, diff: newDiff });
    }
  }, [paragraph, reviewItem, setIsFocused, text, trackEvent, updateReviewItem]);

  return (
    <div>
      <div className="mb-2">{reason}</div>
      <div className="rounded bg-gray-6 p-2">
        {isFocused ? (
          <ClickAwayListener onClickAway={onBlur}>
            <ContentEditable
              className={`outline-none ${isFocused && 'cursor-text'}`}
              onChange={onChange}
              html={editedText.current}
            />
          </ClickAwayListener>
        ) : (
          <button
            type="button"
            onClick={() => setIsFocused(true)}
            className="text-left"
          >
            {diff.map(({ id, diffType, value }) => (
              <span key={id} className={getChangeColor(diffType)}>
                {value}
              </span>
            ))}
          </button>
        )}
      </div>
    </div>
  );
}

interface ReviewItemActionProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  icon: IconDefinition;
}

function ReviewItemAction({ icon, ...props }: ReviewItemActionProps) {
  return (
    <button
      type="button"
      className="flex h-[21px] w-[21px] items-center justify-center rounded p-1 hover:bg-gray-6"
      {...props}
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  );
}

export function ReviewItem({ reviewItem }: { reviewItem: ReviewItemDto }) {
  const { insertReviewItem, dismissReviewItem, updateReviewItem, origin } =
    useReview();
  const { selectText } = useDocument();
  const { trackEvent } = useAnalytics();
  const { name, type, paragraph, text } = reviewItem;
  const editedText = useRef<string>(text);
  const [isFocused, setIsFocused] = useState(false);

  const insertReviewCallback = useDebouncedCallback(
    async (includedRevisionTypes?: RevisionType[]) => {
      trackEvent('Insert Review Item', { type, includedRevisionTypes, origin });
      await insertReviewItem(reviewItem, includedRevisionTypes);
    },
    500,
    { leading: true, trailing: false },
  );

  const onChange = (event: ContentEditableEvent) => {
    editedText.current = event.target.value;
  };

  const onBlur = () => {
    setIsFocused(false);
    if (editedText.current !== text) {
      trackEvent('Edited Review Item', { origin });
      updateReviewItem(reviewItem, { text: editedText.current });
    }
  };

  return (
    <div
      className={`rounded border-[0.5px] ${
        isFocused ? 'border-blue-1' : 'border-gray-5'
      } bg-[#FDFDFD] p-2.5 shadow-2`}
    >
      <div
        className={`mb-1.5 flex justify-between gap-1 border-b-2 pb-1.5 ${LINE_COLORS[type]}`}
      >
        <div className="grow font-bold">{name}</div>
        <BasicTooltip tooltip="View target text in document">
          <ReviewItemAction
            icon={faArrowRightFromBracket}
            onClick={async () => {
              trackEvent('Go To Review Item', { origin });
              await selectText(paragraph);
            }}
          />
        </BasicTooltip>
        <BasicTooltip
          tooltip={`Dismiss ${
            type === RevisionType.comment ? 'comment' : 'change'
          }`}
        >
          <ReviewItemAction
            icon={faXmark}
            onClick={() => {
              trackEvent('Dismiss Review Item', { origin });
              dismissReviewItem(reviewItem);
            }}
          />
        </BasicTooltip>
      </div>
      <div>
        {type === RevisionType.comment ? (
          <ClickAwayListener onClickAway={onBlur}>
            <ContentEditable
              className={`outline-none ${isFocused && 'cursor-text'}`}
              onChange={onChange}
              onBlur={onBlur}
              onFocus={() => setIsFocused(true)}
              html={editedText.current}
            />
          </ClickAwayListener>
        ) : (
          <ModificationBody
            reviewItem={reviewItem}
            isFocused={isFocused}
            setIsFocused={setIsFocused}
          />
        )}
      </div>
      <div className="mt-4 flex h-8 items-center justify-between">
        <p className="pr-2 text-xs italic text-gray-3">
          {isFocused ? 'Editing. Changes save automatically' : ''}
        </p>
        {type === RevisionType.comment ? (
          <BasicTooltip tooltip="Add this comment to the document">
            <button
              type="button"
              className="flex items-center justify-center whitespace-nowrap rounded-sm border-[0.5px] border-gray-1 bg-[#FCFCFC] px-2 py-1 text-xs hover:border-purple-1"
              onClick={() => insertReviewCallback()}
            >
              <FontAwesomeIcon className="mr-1 text-xs" icon={faFileImport} />
              Apply Comment
            </button>
          </BasicTooltip>
        ) : (
          <Menu as="div" className="relative z-10 flex">
            <BasicTooltip tooltip="Add this comment and tracked changes to the document">
              <button
                type="button"
                className=" flex items-center justify-center rounded-l-sm border-[0.5px] border-gray-1 bg-[#FCFCFC] px-2 py-1 text-xs hover:border-purple-1"
                onClick={() =>
                  insertReviewCallback([
                    RevisionType.comment,
                    RevisionType.modification,
                  ])
                }
              >
                <FontAwesomeIcon className="mr-1 text-xs" icon={faFileImport} />
                Apply Changes
              </button>
            </BasicTooltip>
            <Menu.Button
              id="menu-button"
              aria-expanded="true"
              aria-haspopup="true"
              type="button"
              data-testid="review-item-menu-button"
              className="flex items-center justify-center rounded-r-sm border-y-[0.5px] border-r-[0.5px] border-gray-1 bg-[#FCFCFC] px-[6px] py-1 text-xs"
            >
              <CaretDown size={12} weight="fill" />
            </Menu.Button>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 top-7 w-36 origin-top-right rounded-sm border-[0.5px] border-gray-1 bg-[#FCFCFC] p-1 shadow-lg focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() =>
                        insertReviewCallback([RevisionType.comment])
                      }
                      className={`${
                        active ? 'bg-gray-6' : ''
                      } flex w-full items-center rounded-sm px-2 py-1 text-xs`}
                    >
                      Comment Only
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() =>
                        insertReviewCallback([RevisionType.modification])
                      }
                      className={`${
                        active ? 'bg-gray-6' : ''
                      } flex w-full items-center rounded-sm px-2 py-1 text-xs`}
                    >
                      Redline Only
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>
    </div>
  );
}
