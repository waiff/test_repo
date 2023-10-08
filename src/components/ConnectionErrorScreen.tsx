import React from 'react';

export function ConnectionErrorScreen() {
  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="mb-7 p-3 text-center">
        <p>There was an issue connecting to Spellbook.</p>
        <p className="mt-4">
          Please check your internet connection and try again by{' '}
          <button
            role="link"
            type="button"
            className="text-blue-1"
            onClick={() => window.location.reload()}
          >
            reloading Spellbook
          </button>
          . If the problem persists, you can reach us at{' '}
          <a className="text-blue-1" href="mailto:success@spellbook.legal">
            success@spellbook.legal
          </a>
          .
        </p>
      </div>
    </div>
  );
}
