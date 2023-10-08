import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { toast } from 'react-toastify';

import { RallyApiUser } from '../common/RallyApiUser';
import { SpellbookError } from '../common/SpellbookError';
import { getSsoAccessToken } from '../utils/Authentication';

type AuthenticationContextType = {
  user: RallyApiUser | null;
  isAuthenticated: boolean;
  isUsingFallback: boolean;
  setUser: Dispatch<SetStateAction<RallyApiUser | null>>;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  setIsUsingFallback: Dispatch<SetStateAction<boolean>>;
  getToken: () => Promise<string>;
};

const AuthenticationContext = createContext<
  AuthenticationContextType | undefined
>(undefined);

type AuthenticationContextProviderProps = {
  children: React.ReactNode;
};

export function AuthenticationProvider({
  children,
}: AuthenticationContextProviderProps) {
  const { instance } = useMsal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [user, setUser] = useState<RallyApiUser | null>(null);

  const getFallbackToken = useCallback(async () => {
    try {
      const { accessToken } = await instance.acquireTokenSilent({
        scopes: [import.meta.env.VITE_AUTH_CAST_SPELL_SCOPE],
      });

      if (!accessToken) {
        throw new SpellbookError('null fallback token received');
      }

      return accessToken;
    } catch (error: any) {
      if (error instanceof InteractionRequiredAuthError) {
        // user needs to go through the auth flow again in the dialog
        setIsAuthenticated(false);
        setUser(null);
        throw error;
      }

      throw new SpellbookError('unable to get fallback access token', error);
    }
  }, [instance, setIsAuthenticated, setUser]);

  const getToken = useCallback(async () => {
    try {
      if (isUsingFallback) {
        return await getFallbackToken();
      }

      return await getSsoAccessToken();
    } catch (error: any) {
      if (error instanceof SpellbookError || error.name === 'SpellbookError') {
        toast.error(`Unable to acquire token - ${error.message}`);
      }

      throw error;
    }
  }, [isUsingFallback, getFallbackToken]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isUsingFallback,
      setUser,
      setIsAuthenticated,
      setIsUsingFallback,
      getToken,
    }),
    [isAuthenticated, isUsingFallback, user, getToken],
  );

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthentication(): AuthenticationContextType {
  const context = useContext(AuthenticationContext);
  if (context === undefined) {
    throw new Error(
      'useAuthentication must be used within a AuthenticationProvider',
    );
  }
  return context;
}
