import React, { useEffect, useState } from 'react';

import SpellbookLogo from '../../assets/SpellbookByRally-small-logo.png';
import { handleException } from '../utils/ErrorUtils';
import { Spinner } from './Spinner';

function pickRandom(array: string[]) {
  return array[Math.floor(Math.random() * array.length)];
}

const labels = [
  'Summoning wizards...',
  'Catching the newts...',
  'Polishing the cauldrons...',
  'Stirring the potions...',
  'Consulting the oracles...',
  'Summoning the spirits...',
  'Reading the stars...',
  'Indexing the tomes...',
  'Reticulating splines...',
];

const MAX_INITIALIZING_WAIT = 10_000; // 10 seconds

export function Initializing() {
  const [label, setLabel] = useState<string>(pickRandom(labels));
  const [showRetry, setShowRetry] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLabel(pickRandom(labels));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowRetry(true);
      handleException(new Error('Initializing timed out'));
    }, MAX_INITIALIZING_WAIT);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <img className="h-12 pb-5" src={SpellbookLogo} alt="Spellbook" />
      {showRetry ? (
        <>
          <div className="pb-5">
            Sorry! Something went wrong loading Spellbook.
          </div>
          <button
            type="button"
            className="rounded bg-gray-400 px-4 py-2 font-bold text-white focus:outline-none"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </>
      ) : (
        <Spinner label={label} />
      )}
    </div>
  );
}
