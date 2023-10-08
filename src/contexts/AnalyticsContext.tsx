import mixpanel, { Config as MixpanelConfig } from 'mixpanel-browser';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuthentication } from './AuthenticationContext';
import { useSpellbookUser } from './SpellbookUserContext';

type MixpanelTrackArgs = Parameters<typeof mixpanel.track>;
type MixpanelTrackLinkArgs = Parameters<typeof mixpanel.track_links>;

type AnalyticsContextType = {
  isConfigured: boolean;
  trackEvent: (...args: MixpanelTrackArgs) => void;
  trackLink: (...args: MixpanelTrackLinkArgs) => void;
};

export const AnalyticsContext = React.createContext<
  AnalyticsContextType | undefined
>(undefined);

type AnalyticsContextProviderProps = {
  children?: React.ReactNode;
};

export function AnalyticsProvider({ children }: AnalyticsContextProviderProps) {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const { user } = useAuthentication();
  const { status, validated, isLoading } = useSpellbookUser();

  useEffect(() => {
    const mixpanelToken = import.meta.env.VITE_MIXPANEL_TOKEN;

    if (mixpanelToken) {
      const config: Partial<MixpanelConfig> = {
        debug: import.meta.env.DEV,
      };

      if (import.meta.env.PROD) {
        config.api_host = 'https://insights.rallynow.io';
      }

      mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN, config);
      setIsConfigured(true);
    }
  }, []);

  useEffect(() => {
    if (!!user?.id && !isLoading) {
      const mixpanelPerson = {
        $email: user.email,
        $name: user.name,
        user_id: user.id,
        oid: user.id,
      };
      if (!isConfigured && process.env.NODE_ENV === 'development') {
        console.log('mock identify user', { id: user.sub, ...mixpanelPerson });
      } else if (isConfigured) {
        mixpanel.identify(user.sub);
        mixpanel.people.set(mixpanelPerson);
      }
    }

    return () => {
      if (isConfigured) {
        mixpanel.reset();
      } else {
        console.log('mock mixpanel reset');
      }
    };
  }, [user, isConfigured, isLoading, status, validated]);

  const trackEvent = useCallback(
    (...args: MixpanelTrackArgs) => {
      if (!isConfigured && process.env.NODE_ENV === 'development') {
        console.log('mock track user event', args);
      } else {
        mixpanel.track(...args);
      }
    },
    [isConfigured],
  );

  const trackLink = useCallback(
    (...args: MixpanelTrackLinkArgs) => {
      if (!isConfigured && process.env.NODE_ENV === 'development') {
        console.log('mock track user link', args);
      } else {
        mixpanel.track_links(...args);
      }
    },
    [isConfigured],
  );

  const value = useMemo(
    () => ({ isConfigured, trackEvent, trackLink }),
    [isConfigured, trackEvent, trackLink],
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within a AnalyticsProvider');
  }
  return context;
}
