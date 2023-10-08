import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faFileImport } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import { decode } from 'html-entities';
import { fakCopy } from '../icons/fakSpellIcons';
import { DocumentService } from '../services/DocumentService';
import { copyToClipboard } from '../utils/ClipboardUtils';
import { handleException } from '../utils/ErrorUtils';
import { Drawer } from './Drawer';
import { DraftAction } from './DraftAction';
import { ClauseSearchResponseItem } from '../services/RallyApiService';

export function ClauseDrawer({
  isOpen,
  setIsOpen,
  selectedClause,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  selectedClause?: ClauseSearchResponseItem | null;
}) {
  const { clause: { text = '', title = '' } = {} } = selectedClause ?? {};
  const contentEditableRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [editedContent, setEditedContent] = useState(text || '');

  const onChange = (event: ContentEditableEvent) => {
    setEditedContent(event.target.value);
  };

  useEffect(() => {
    if (contentEditableRef.current) {
      const element = contentEditableRef.current;
      setIsOverflowing(element.clientHeight < element.scrollHeight);
    }
  }, [selectedClause]);

  useEffect(() => {
    setEditedContent(text || '');
  }, [text]);

  return (
    <Drawer
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Use Clause"
      subtitle={<h3 className="font-bold">{title}</h3>}
    >
      <div className="mx-2 flex h-full flex-col">
        <div
          className={`mt-4 h-[60vh] basis-full justify-between overflow-y-hidden rounded-md hover:border-gray-4 max-sm:h-[30vh] ${
            isFocused
              ? 'cursor-text border border-gray-4 p-2'
              : 'border border-transparent p-2'
          } 
          ${isOverflowing && 'pr-0'}
          `}
        >
          <ContentEditable
            data-testid="clause-card-content"
            className={`box-border inline-block h-full w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap text-gray-1 outline-none ${
              isFocused && 'cursor-text'
            } ${isOverflowing && 'pr-2'}`}
            onChange={onChange}
            onBlur={() => {
              setIsFocused(false);
            }}
            onCopy={(e) => {
              e.preventDefault();
              const selection = window.getSelection()?.toString();
              if (selection) {
                navigator.clipboard.writeText(selection);
              }
            }}
            onFocus={() => setIsFocused(true)}
            html={editedContent}
          />
        </div>
        <p className="h-4 py-1 pr-2 text-xs italic text-gray-3">
          {isFocused ? 'Editing.' : ''}
        </p>

        <div className="my-6 flex h-[26px] justify-between self-end text-xs">
          <DraftAction
            title="Copy"
            testId="copy-clause"
            showTooltip={false}
            className="mr-[5px] flex items-center justify-center rounded border-[0.5px] border-transparent bg-gray-6 px-2 py-1 hover:border-gray-3"
            action={async () => {
              try {
                await copyToClipboard(decode(editedContent));
                toast.success('Clause copied to clipboard');
              } catch (error) {
                handleException(error);
                toast.error('Unable to copy clause to clipboard');
              }
            }}
          >
            <FontAwesomeIcon
              className="mr-1 text-sm"
              icon={fakCopy as IconProp}
            />
            Copy
          </DraftAction>
          <DraftAction
            title="Insert"
            testId="insert-clause"
            showTooltip={false}
            className="flex items-center justify-center rounded border-[0.5px] border-transparent bg-gray-6 px-2 py-1 hover:border-gray-3"
            action={() => {
              Word.run(async (context) => {
                const selection = await DocumentService.getSelection(context);
                const cursor = context.document
                  .getSelection()
                  .getRange('Start');

                const replacedRange = await DocumentService.replaceSelection(
                  context,
                  selection ?? cursor,
                  decode(editedContent),
                );
                await DocumentService.selectRange(context, replacedRange);
              }).catch((error) => handleException(error));
            }}
          >
            <FontAwesomeIcon className="mr-1 text-sm" icon={faFileImport} />
            Insert at Cursor
          </DraftAction>
        </div>
      </div>
    </Drawer>
  );
}
