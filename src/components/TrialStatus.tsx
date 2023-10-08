import React, { useEffect, useMemo, useState } from 'react';

import { useSpellbookUser } from '../contexts/SpellbookUserContext';
import { SpellbookUserStatus } from '../services/RallyApiService';
import { friendlyDuration } from '../utils/date-utils';

export function TrialStatus() {
  const { status, trialEndTime, setShowActivation } = useSpellbookUser();

  const [endsInDuration, setEndsInDuration] = useState<string>('');

  // @ts-ignore FIX-ME
  const trialEndDate = useMemo(() => new Date(trialEndTime), [trialEndTime]);

  useEffect(() => {
    setEndsInDuration(
      friendlyDuration(trialEndDate, new Date(), { futureRelation: '' }),
    );

    const interval = window.setInterval(() => {
      setEndsInDuration(
        friendlyDuration(trialEndDate, new Date(), { futureRelation: '' }),
      );
    }, 5_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [trialEndDate]);

  if (status !== SpellbookUserStatus.TRIAL) {
    return null;
  }

  return (
    <div className="left-0 top-0 inline w-full bg-gray-1 text-center text-sm text-gray-4">
      <div>
        Trial ends{' '}
        {endsInDuration === 'soon' ? endsInDuration : `in ${endsInDuration}`}
        {' - '}
        <button
          className="cursor-pointer font-bold text-purple-2"
          type="button"
          onClick={() => {
            setShowActivation(true);
          }}
        >
          Activate Now
        </button>
      </div>
    </div>
  );
}
