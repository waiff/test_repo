import launchDarklyAdapter from '@flopflip/launchdarkly-adapter';
import localAdapter from '@flopflip/localstorage-adapter';
import { ConfigureFlopFlip } from '@flopflip/react-broadcast';
import React from 'react';

import { useAuthentication } from '../contexts/AuthenticationContext';
import { useSpellbookUser } from '../contexts/SpellbookUserContext';
import { Spinner, SpinnerSize } from './Spinner';

export function FlagProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthentication();
  const { isLoading, licenseEntitlements } = useSpellbookUser();

  const { adapter, adapterArgs } = import.meta.env.VITE_LAUNCH_DARKLY_CLIENT_ID
    ? {
        adapter: launchDarklyAdapter,
        adapterArgs: {
          sdk: {
            clientSideId: import.meta.env.VITE_LAUNCH_DARKLY_CLIENT_ID,
          },
        },
      }
    : { adapter: localAdapter, adapterArgs: {} };

  if (!user || isLoading) {
    return (
      <div style={{ marginTop: '2rem' }}>
        <Spinner size={SpinnerSize.large} label="Initializing..." />;
      </div>
    );
  }

  return (
    <ConfigureFlopFlip
      adapter={adapter}
      adapterArgs={{
        ...adapterArgs,
        user: {
          key: user?.id,
          email: user?.email,
          name: user?.name,
          custom: {
            entitlements: licenseEntitlements,
          },
        },
      }}
    >
      {({ isAdapterConfigured }) =>
        isAdapterConfigured ? (
          children
        ) : (
          <div style={{ marginTop: '2rem' }}>
            <Spinner size={SpinnerSize.large} label="Initializing..." />
          </div>
        )
      }
    </ConfigureFlopFlip>
  );
}
