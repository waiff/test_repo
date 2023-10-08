import {
  ReactNode,
  useState,
  Fragment,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Menu, Transition } from '@headlessui/react';
import { faEllipsis, faArrowUpRight } from '@fortawesome/pro-regular-svg-icons';
import {
  faArrowUpRightAndArrowDownLeftFromCenter,
  faArrowDownLeftAndArrowUpRightToCenter,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { usePlaybook } from '../contexts/PlaybookContext';
import { useReview } from '../contexts/ReviewContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { ReviewLens } from '../types/ReviewLens';
import { Playbook, RevisionType } from '../services/RallyApiService';
import { ProgressRing } from './ProgressRing';

const INSTRUCTION_LIMIT = 4000;

function MenuItem({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          type="button"
          className={`
            ${active ? 'bg-gray-6' : ''} 
            w-full p-1 pr-2 text-left text-xs 
          `}
          onClick={onClick}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
}

export function PlaybookCard({
  id,
  title,
  instruction,
  setIsOpen,
}: {
  id: string;
  title: string;
  instruction: string;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const { trackEvent } = useAnalytics();
  const { updatePlaybook, deletePlaybook, playbooks } = usePlaybook();
  const { setActiveReviewLens, updateReviewLens } = useReview();
  const [isEditing, setIsEditing] = useState(!instruction);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedInstruction, setEditedInstruction] = useState(instruction);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTextOverflowing, setIsTextOverflowing] = useState(false);

  const textRef = useRef<HTMLParagraphElement>(null);

  const handleCancel = () => {
    setIsEditing(false);
    setEditedInstruction(instruction);
    setEditedTitle(title);
    setErrorMessage('');
  };

  const handleSave = useCallback(() => {
    if (editedTitle.trim() === '') {
      setErrorMessage('Title is required');
      return;
    }

    if (editedInstruction.trim() === '') {
      setErrorMessage('Instructions are required');
      return;
    }

    if (editedInstruction.trim().length > INSTRUCTION_LIMIT) {
      setErrorMessage('Provided instruction exceeds character limit');
      return;
    }

    trackEvent('Edited Playbook');
    updatePlaybook(id, editedTitle, editedInstruction);
    setIsEditing(false);
    setErrorMessage('');
  }, [editedInstruction, editedTitle, id, trackEvent, updatePlaybook]);

  useEffect(() => {
    const textElement = textRef.current;
    if (textElement) {
      setIsTextOverflowing(
        textElement.scrollHeight > 200 ||
          textElement.scrollHeight > textElement.clientHeight,
      );
    }
  }, [editedInstruction, handleSave, isEditing]);

  return (
    <div
      key={title}
      className="flex flex-col space-y-2 rounded-xl border border-gray-3 p-4"
    >
      <div className="flex items-center justify-between">
        {isEditing ? (
          <input
            className="w-4/5 cursor-text rounded border border-gray-4 px-2 py-1 font-bold outline-none focus:border-blue-1"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            aria-label="Edit Title"
          />
        ) : (
          <h2 className="font-bold">{editedTitle}</h2>
        )}
        <Menu as="div" className="relative z-40 inline-block text-left">
          <Menu.Button
            className="inline-flex w-full justify-center rounded-md bg-white px-2 py-1 text-sm font-medium hover:bg-gray-6 focus:outline-none"
            onClick={(e: any) => {
              e.stopPropagation();
            }}
          >
            <FontAwesomeIcon
              icon={faEllipsis}
              className="text-base font-bold text-gray-2 group-hover/button:text-purple-1"
            />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-1 origin-top-right cursor-pointer rounded-md border border-gray-3 bg-white shadow-lg focus:outline-none">
              <div className="p-1">
                <MenuItem
                  onClick={() => {
                    setIsEditing(true);
                  }}
                >
                  Edit
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    trackEvent('Deleted Playbook');
                    deletePlaybook(id);
                  }}
                >
                  Delete
                </MenuItem>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <div
            className={`h-32 ${
              isTextOverflowing || isEditing ? 'h-72' : ''
            } rounded-lg border border-gray-4 p-2 pr-1 focus-within:border-blue-1`}
          >
            <textarea
              className="h-full w-full cursor-text resize-none outline-none"
              value={editedInstruction}
              onChange={(e) => setEditedInstruction(e.target.value)}
              aria-label="Edit Instruction"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={isEditing}
            />
          </div>
          <div className="flex justify-end gap-1.5 text-xs">
            <div className="text-gray-2">
              {editedInstruction.length}/{INSTRUCTION_LIMIT}
            </div>
            <ProgressRing
              percent={Math.min(
                (editedInstruction.length / INSTRUCTION_LIMIT) * 100,
                100,
              )}
              error={editedInstruction.length > INSTRUCTION_LIMIT}
              size={14}
              strokeWidth={2}
            />
          </div>
        </div>
      ) : (
        <p
          ref={textRef}
          className={`relative ${
            isTextOverflowing && !isExpanded ? 'max-h-56 overflow-hidden' : ''
          }`}
        >
          {editedInstruction}
          {isTextOverflowing && !isExpanded && (
            <span className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white" />
          )}
        </p>
      )}
      {errorMessage && (
        <p className="mt-2 text-feedback-error-medium">{errorMessage}</p>
      )}
      <div className="w-full self-end">
        {isEditing ? (
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="rounded px-2 py-1 font-bold"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-rally-gradient px-2 py-1 font-bold text-white"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex justify-between">
            <div>
              {isTextOverflowing && (
                <button
                  aria-label="expand"
                  type="button"
                  onClick={() => {
                    setIsExpanded(!isExpanded);
                  }}
                >
                  <FontAwesomeIcon
                    icon={
                      isExpanded
                        ? (faArrowDownLeftAndArrowUpRightToCenter as IconProp)
                        : (faArrowUpRightAndArrowDownLeftFromCenter as IconProp)
                    }
                    className="text-sm font-bold text-gray-1"
                  />
                </button>
              )}
            </div>
            <button
              type="button"
              className="flex items-center space-x-1 rounded-full bg-purple-2 px-4 py-1 font-bold text-purple-3"
              onClick={() => {
                setActiveReviewLens(ReviewLens.Custom);
                updateReviewLens({
                  lens: ReviewLens.Playbooks,
                  instruction: editedInstruction,
                  includedRevisionTypes: [
                    RevisionType.comment,
                    RevisionType.modification,
                  ],
                  playbook: playbooks.find(
                    (playbook: Playbook) => playbook._id === id,
                  ),
                });
                setIsOpen(false);
              }}
            >
              <span>Use</span>
              <FontAwesomeIcon
                icon={faArrowUpRight}
                className="text-base font-bold text-purple-3"
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
