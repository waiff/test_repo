import React, { useEffect, useState } from 'react';

import { useSpellbookUser } from '../contexts/SpellbookUserContext';
import { SpellbookUserStatus } from '../services/RallyApiService';
import { Activation } from './Activation';
import { BlockedScreen } from './BlockedScreen';
import { ConnectionErrorScreen } from './ConnectionErrorScreen';
import { Spinner, SpinnerSize } from './Spinner';

type SpellbookLicenseCheckProps = {
  children: React.ReactNode;
};

export function SpellbookLicenseCheck({
  children,
}: SpellbookLicenseCheckProps) {
  const { isLoading, status, hasAccess, showActivation, trialEndTime } =
    useSpellbookUser();
  const [trialExpired, setTrialExpired] = useState<boolean>(false);

  useEffect(() => {
    if (status === SpellbookUserStatus.ACTIVE) {
      setTrialExpired(false);
      return () => {};
    }

    // @ts-ignore FIX-ME
    setTrialExpired(trialEndTime < Date.now());

    const interval = window.setInterval(
      // @ts-ignore FIX-ME
      () => setTrialExpired(trialEndTime < Date.now()),
      5_000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [status, trialEndTime]);

  if (isLoading) {
    return (
      <div className="mt-8">
        <Spinner size={SpinnerSize.large} label="Authorizing..." />
      </div>
    );
  }

  if (status === SpellbookUserStatus.ACTIVE) {
    return <>{children}</>;
  }

  if (status === SpellbookUserStatus.TRIAL) {
    if (showActivation || !hasAccess || trialExpired) {
      return <Activation trialExpired={trialExpired} />;
    }

    return <>{children}</>;
  }

  if (status === SpellbookUserStatus.BLOCKED) {
    return <BlockedScreen />;
  }

  return <ConnectionErrorScreen />;
}
