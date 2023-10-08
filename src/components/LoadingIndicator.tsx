import React from 'react';

export function LoadingIndicator() {
  return (
    <div className="ml-1 flex">
      <span
        className="relative mr-[2px] inline-block h-1 w-1 animate-[dotFlash_600ms_infinite_linear_alternate] rounded bg-gray-4"
        role="status"
        aria-label="loading"
      />
      <span
        className="relative mr-[2px] inline-block h-1 w-1 animate-[dotFlash_600ms_infinite_300ms_ease-in_alternate] rounded bg-gray-4"
        role="status"
        aria-label="loading"
      />
      <span
        className="relative mr-[2px] inline-block h-1 w-1 animate-[dotFlash_600ms_infinite_600ms_ease-in_alternate] rounded bg-gray-4"
        role="status"
        aria-label="loading"
      />
    </div>
  );
}
