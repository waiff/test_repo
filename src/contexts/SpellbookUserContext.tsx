import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRallyApi } from '../hooks/useRallyApi';
import {
  SpellbookUser,
  SpellbookUserStatus,
} from '../services/RallyApiService';
import { handleException } from '../utils/ErrorUtils';

export type SpellbookUserContextType = {
  isLoading: boolean;
  status: SpellbookUserStatus;
  licenseTags: string[];
  licenseEntitlements: string[];
  licenseStatus: string;
  validated: boolean;
  hasAccess?: boolean;
  trialEndTime?: number;
  identifyUser?: () => Promise<void>;
  showActivation: boolean;
  setShowActivation: (showActivation: boolean) => void;
  createdAt?: Date;
};

export const SpellbookUserContext = createContext<
  SpellbookUserContextType | undefined
>(undefined);

type SpellbookUserContextProviderProps = {
  children: React.ReactNode;
};

export function SpellbookUserContextProvider({
  children,
}: SpellbookUserContextProviderProps) {
  const { identify } = useRallyApi();

  const [showActivation, setShowActivation] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<SpellbookUser>({
    status: SpellbookUserStatus.UNKNOWN,
    hasAccess: true,
    validated: false,
    licenseTags: [],
    licenseEntitlements: [],
    licenseStatus: 'UNKNOWN',
  });

  const identifyUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await identify();
      setUser(result);
    } catch (error) {
      handleException(error);
    } finally {
      setIsLoading(false);
    }
  }, [identify]);

  useEffect(() => {
    identifyUser();
  }, [identifyUser]);

  const value = useMemo(
    () => ({
      ...user,
      isLoading,
      identifyUser,
      showActivation,
      setShowActivation,
    }),
    [identifyUser, isLoading, showActivation, user],
  );

  return (
    <SpellbookUserContext.Provider value={value}>
      {children}
    </SpellbookUserContext.Provider>
  );
}

export function useSpellbookUser(): SpellbookUserContextType {
  const context = useContext(SpellbookUserContext);
  if (context === undefined) {
    throw new Error(
      'useSpellbookUser must be used within a SpellbookUserContextProvider',
    );
  }
  return context;
}
