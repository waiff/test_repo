import { Dispatch, SetStateAction } from 'react';
import {
  StackSimple,
  BookmarkSimple,
  ArrowUpRight,
  TrashSimple,
} from '@phosphor-icons/react';
import { useLibrary } from '../contexts/LibraryContext';
import { DraftAction } from './DraftAction';
import { ClauseSearchResponseItem } from '../services/RallyApiService';

export function LibraryClauseCard({
  clause,
  setIsDrawerOpen,
  setSelectedClause,
}: {
  clause: ClauseSearchResponseItem;
  setIsDrawerOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedClause: Dispatch<SetStateAction<ClauseSearchResponseItem | null>>;
}) {
  const {
    clause: { _id: id, title, text },
    userClauseData: { isBookmark, numDocuments },
  } = clause;
  const { bookmarkClause, unbookmarkClause, deleteClause, trackUseClause } =
    useLibrary();

  return (
    <div
      className="group flex flex-col rounded-xl border border-gray-3"
      key={id}
    >
      <div className="space-y-2 border-b border-gray-4 p-4">
        <div className="flex w-full items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <div className="flex items-center space-x-2">
            <DraftAction
              title="Delete"
              testId="delete-clause"
              className="flex items-center"
              action={() => {
                deleteClause(id);
              }}
            >
              <TrashSimple
                size={20}
                weight="bold"
                className="text-gray-3 opacity-0 group-hover:opacity-100"
              />
            </DraftAction>
            <DraftAction
              title={`${isBookmark ? 'Remove Bookmark' : 'Bookmark'}`}
              testId={`${
                isBookmark ? 'remove-bookmarked-clause' : 'bookmark-clause'
              }`}
              className="flex items-center"
              action={() => {
                if (isBookmark) {
                  unbookmarkClause(id);
                } else {
                  bookmarkClause(id);
                }
              }}
            >
              {isBookmark ? (
                <BookmarkSimple
                  size={21}
                  weight="fill"
                  className="text-feedback-error-medium"
                />
              ) : (
                <BookmarkSimple
                  size={21}
                  weight="bold"
                  className="text-gray-3 opacity-0 group-hover:opacity-100"
                />
              )}
            </DraftAction>
          </div>
        </div>
        <p className="relative whitespace-pre-line">{text}</p>
      </div>
      <div className="flex items-center gap-1 p-3">
        <StackSimple size="21" className="text-gray-2" />
        <div className="text-xs font-bold text-gray-2">{numDocuments}</div>
        <button
          type="button"
          className="ml-auto flex items-center space-x-1 rounded-full bg-purple-2 px-4 py-1 font-bold text-purple-3"
          onClick={() => {
            setIsDrawerOpen(true);
            setSelectedClause(clause);
            trackUseClause(id);
          }}
        >
          <span>Use</span>
          <ArrowUpRight size={18} weight="bold" className="text-purple-3" />
        </button>
      </div>
    </div>
  );
}
