import { Fragment, useEffect, useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import {
  Check,
  CheckSquare,
  FunnelSimple,
  SortAscending,
  Square,
} from '@phosphor-icons/react';
import { Listbox, Popover, Transition } from '@headlessui/react';
import DebouncedSearchBar from './DebouncedSearchBar';
import { BasicTooltip } from './tooltip/Tooltip';
import { ClauseDrawer } from './ClauseDrawer';
import { useLibrary } from '../contexts/LibraryContext';
import {
  ClauseSearchResponseItem,
  ClauseSearchSortType,
  DocStoreType,
} from '../services/RallyApiService';
import { useDraft } from '../contexts/DraftContext';
import { getLogo } from './LibraryManageCard';
import { LibraryClauseCard } from './LibraryClauseCard';
import { useQueryParams } from '../hooks/useQueryParams';
import { Spinner } from './Spinner';

function SortItem({
  name,
  value,
}: {
  name: string;
  value: ClauseSearchSortType;
}) {
  return (
    <Listbox.Option value={value}>
      {({ selected }) => (
        <button
          type="button"
          className="flex w-full items-center space-x-2 rounded-md p-1 text-left hover:bg-gray-6"
        >
          {selected ? (
            <Check size={15} weight="bold" className="w-4" />
          ) : (
            <span className="w-4" />
          )}
          <span>{name}</span>
        </button>
      )}
    </Listbox.Option>
  );
}

function FilterItem({
  _id,
  name,
  type,
}: {
  _id: string;
  name: string;
  type: DocStoreType;
}) {
  return (
    <Listbox.Option
      className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-gray-6"
      value={_id}
    >
      {({ selected }) => (
        <>
          <div className="flex items-center">
            <img
              src={getLogo(type)}
              className="inline-block h-4 w-4"
              alt={`${type} Logo`}
            />
            <span
              className="inline-block max-w-[11rem] truncate px-2"
              title={name}
            >
              {name}
            </span>
          </div>
          {selected ? (
            <CheckSquare size={20} weight="fill" className="text-blue-2" />
          ) : (
            <Square size={20} weight="light" className="text-gray-2" />
          )}
        </>
      )}
    </Listbox.Option>
  );
}

export function LibrarySearch() {
  const { draftInstructions } = useDraft();
  const {
    clauses,
    docStores,
    searchQuery,
    setSearchQuery,
    hasSearched,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    searchClauses,
    isSearchLoading,
  } = useLibrary();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedClause, setSelectedClause] =
    useState<null | ClauseSearchResponseItem>(null);
  const queryParams = useQueryParams();
  const isSearchDisabled = !searchQuery.trim().length || isSearchLoading;

  useEffect(() => {
    const fromDraftTab = queryParams.get('fromDraftTab');
    if (fromDraftTab === 'true') {
      setSearchQuery(draftInstructions);
    }
  }, [draftInstructions, setSearchQuery, queryParams]);

  function getFiltersText() {
    if (!docStores.length) {
      return 'No Documents to Filter By';
    }
    switch (filters.length) {
      case 0:
        return 'Filter By';
      case 1:
        return '1 Filter Selected';
      default:
        return `${filters.length} Filters Selected`;
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-hidden">
      <div className="mx-2">
        <div className="mb-3 flex">
          <div className="mr-2 grow">
            <DebouncedSearchBar
              placeholder="Search by clause name"
              setSearchQuery={setSearchQuery}
              searchQuery={searchQuery}
              wait={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSearchDisabled) {
                  searchClauses();
                }
              }}
            />
          </div>
          <button
            type="button"
            disabled={isSearchDisabled}
            onClick={searchClauses}
            className="rounded-xl px-3 py-1 text-sm font-bold text-white
              enabled:bg-rally-gradient disabled:bg-gray-3
              disabled:opacity-50"
          >
            Search
          </button>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-2">
            {clauses.length} Results
          </span>
          <div className="space-x-2">
            <Popover as="div" className="relative inline-block text-left">
              <Popover.Button
                disabled={!docStores.length}
                className={`relative inline-flex aspect-square items-center justify-center rounded-md px-2 py-1 text-sm outline-none hover:bg-gray-6 disabled:cursor-not-allowed
                  ${filters.length ? 'bg-gray-6' : 'bg-white'}`}
                onClick={(e: any) => {
                  e.stopPropagation();
                }}
              >
                <BasicTooltip tooltip={getFiltersText()}>
                  <FunnelSimple
                    size={20}
                    weight="bold"
                    className="inline-block h-full"
                  />
                  {!!filters.length && (
                    <div className="absolute right-0 top-0 h-2 w-2 rounded-full bg-blue-1" />
                  )}
                </BasicTooltip>
              </Popover.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Popover.Panel className="absolute right-0 z-10 mt-1 w-max rounded-md border border-gray-3 bg-white p-1 shadow-lg">
                  <Listbox
                    as="div"
                    value={filters}
                    onChange={setFilters}
                    multiple
                  >
                    <Listbox.Options
                      static
                      className="cursor-pointer focus:outline-none"
                    >
                      {docStores.map(
                        ({ _id, documentStoreType: type, name }) => (
                          <FilterItem _id={_id} type={type} name={name} />
                        ),
                      )}
                    </Listbox.Options>
                  </Listbox>

                  <hr className="-mx-1 my-1 bg-gray-6" />
                  <div className="flex items-center justify-between p-2">
                    <button
                      type="button"
                      className="text-xs text-gray-2 underline underline-offset-2 hover:text-gray-3"
                      onClick={() => {
                        setFilters([]);
                      }}
                    >
                      Clear filters
                    </button>
                    <Popover.Button
                      type="button"
                      className="flex items-center space-x-1 rounded-lg bg-purple-2 px-3 py-1 text-sm font-bold text-purple-3"
                      onClick={searchClauses}
                    >
                      Apply
                    </Popover.Button>
                  </div>
                </Popover.Panel>
              </Transition>
            </Popover>

            <Listbox
              as="div"
              className="relative inline-block text-left"
              value={sortBy}
              onChange={(selected: ClauseSearchSortType) => {
                if (sortBy === selected) return;
                setSortBy(selected);
                searchClauses();
              }}
            >
              <Listbox.Button
                className="inline-flex aspect-square items-center justify-center rounded-md bg-white px-2 py-1 text-sm font-medium hover:bg-gray-6 focus:outline-none"
                onClick={(e: any) => {
                  e.stopPropagation();
                }}
              >
                <BasicTooltip tooltip="Sort By">
                  <SortAscending
                    size={20}
                    weight="bold"
                    className="inline-block"
                  />
                </BasicTooltip>
              </Listbox.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Listbox.Options className="absolute right-0 z-10 mt-1 w-48 origin-top-right cursor-pointer rounded-md border border-gray-3 bg-white shadow-lg focus:outline-none">
                  <div className="p-1">
                    <SortItem
                      name="Number of Occurrences"
                      value={ClauseSearchSortType.NUM_OCCURRENCES}
                    />
                    <SortItem
                      name="Frequency of Use"
                      value={ClauseSearchSortType.FREQUENCY}
                    />
                    <SortItem
                      name="Recently Used"
                      value={ClauseSearchSortType.RECENTLY_USED}
                    />
                  </div>
                </Listbox.Options>
              </Transition>
            </Listbox>
          </div>
        </div>
        <hr className="bg-gray-6" />
      </div>
      <div className="flex basis-full flex-col gap-4 overflow-y-auto px-2 py-4">
        {isSearchLoading ? (
          <Spinner /> // TODO: switch this out for a loading skeleton?
        ) : (
          <>
            {clauses.length ? (
              <TransitionGroup component={null}>
                {clauses?.map((clause: ClauseSearchResponseItem) => {
                  const {
                    clause: { _id: id },
                  } = clause;
                  return (
                    <CSSTransition
                      key={id}
                      classNames="fadescale"
                      timeout={300}
                    >
                      <LibraryClauseCard
                        key={id}
                        clause={clause}
                        setIsDrawerOpen={setIsDrawerOpen}
                        setSelectedClause={setSelectedClause}
                      />
                    </CSSTransition>
                  );
                })}
                <ClauseDrawer
                  isOpen={isDrawerOpen}
                  setIsOpen={setIsDrawerOpen}
                  selectedClause={selectedClause}
                />
              </TransitionGroup>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="pb-12 text-center">
                  <p className="text-base text-gray-2">
                    {hasSearched
                      ? 'It looks like no clauses matched your search'
                      : 'Search to find clauses'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
