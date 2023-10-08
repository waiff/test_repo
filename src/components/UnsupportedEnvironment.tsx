import React from 'react';

export function UnsupportedEnvironment() {
  return (
    <div className="mt-5 flex flex-col p-10">
      <h1 className="mb-5 text-2xl">Unsupported Environment</h1>
      <div className="mb-5">
        Spellbook is an Add-In for Microsoft Word, and is unsupported for this
        platform. Please load Spellbook inside of Microsoft Word, go to{' '}
        <a className="text-blue-1" href="https://www.spellbook.legal">
          https://www.spellbook.legal
        </a>{' '}
        or reach out to{' '}
        <a className="text-blue-1" href="mailto:success@spellbook.legal">
          success@spellbook.legal
        </a>{' '}
        for help.
      </div>
    </div>
  );
}
