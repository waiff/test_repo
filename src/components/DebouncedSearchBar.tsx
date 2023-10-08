import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { MagnifyingGlass } from '@phosphor-icons/react';

function DebouncedSearchBar({
  searchQuery = '',
  setSearchQuery,
  placeholder,
  wait = 500,
  onKeyDown,
}: {
  searchQuery?: string;
  setSearchQuery: (query: string) => void;
  placeholder: string;
  wait?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [value, setValue] = useState(searchQuery);
  useEffect(() => setValue(searchQuery), [searchQuery]);
  const debounced = useDebouncedCallback(setSearchQuery, wait);
  return (
    <div className="flex items-center gap-1 rounded-xl border border-gray-4 p-2 text-gray-2 shadow-1">
      <MagnifyingGlass size={15} weight="bold" />
      <input
        type="text"
        className="w-full outline-none placeholder:text-gray-3"
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          debounced(e.target.value);
        }}
        value={value}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

export default DebouncedSearchBar;
