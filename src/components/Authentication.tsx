import * as Sentry from '@sentry/react';
import jwtDecode from 'jwt-decode';
import React, { useCallback, useEffect, useState } from 'react';

import { useAuthentication } from '../contexts/AuthenticationContext';
import { getSsoAccessToken } from '../utils/Authentication';
import { handleException } from '../utils/ErrorUtils';
import { ErrorBox } from './ErrorBox';
import { FallbackAuth } from './FallbackAuth';
import { Button, ButtonSize } from './Button';
import { Spinner, SpinnerSize } from './Spinner';

// errors documented at https://learn.microsoft.com/en-us/office/dev/add-ins/develop/troubleshoot-sso-in-office-add-ins
enum SsoErrorCode {
  GET_ACCESS_TOKEN_NOT_SUPPORTED = 13000,
  USER_NOT_SIGNED_IN = 13001,
  USER_ABORTED_SIGN_IN_OR_CONSENT = 13002,
  USER_TYPE_NOT_SUPPORTED = 13003,
  INVALID_RESOURCE = 13004,
  INVALID_GRANT = 13005,
  CLIENT_ERROR = 13006,
  UNABLE_TO_GET_ACCESS_TOKEN = 13007,
  GET_ACCESS_TOKEN_CALLED_BEFORE_PREVIOUS_COMPLETED = 13008,
  ZONE_CONFLICT = 13010,
  GET_ACCESS_TOKEN_UNSUPPORTED_OR_CONSENT_MISSING = 13012,
  GET_ACCESS_TOKEN_CALLED_TOO_MANY_TIMES = 13013,
  CACHED_OR_OLD_OFFICE_VERSION = 50001,
}

type AuthenticationProps = {
  children?: React.ReactNode;
};

function getAuthenticationErrorMessage(code: number): string {
  switch (code) {
    case SsoErrorCode.USER_NOT_SIGNED_IN:
      return 'Spellbook requires you to be signed in to Office to work. Click "Log In" below to get started!';
    case SsoErrorCode.USER_ABORTED_SIGN_IN_OR_CONSENT:
      return 'Spellbook requires your consent in order to work with your documents. Click "Log In" below to try again.';
    case SsoErrorCode.CLIENT_ERROR:
      return 'Office on the web is experiencing a problem. Please sign out of Office, close the browser, and then start again.';
    case SsoErrorCode.GET_ACCESS_TOKEN_CALLED_BEFORE_PREVIOUS_COMPLETED:
      return 'Office is still working on the last operation. When it completes, try this operation again.';
    case SsoErrorCode.ZONE_CONFLICT:
      return "Follow the instructions to change your browser's zone configuration.";
    default:
      return 'Unknown error. Try again later.';
  }
}

class AuthenticationError extends Error {
  public readonly name = 'AuthenticationError';

  constructor(public readonly code: number) {
    super(getAuthenticationErrorMessage(code));
  }
}

export function Authentication({ children }: AuthenticationProps) {
  const {
    isAuthenticated,
    isUsingFallback,
    setUser,
    setIsAuthenticated,
    setIsUsingFallback,
  } = useAuthentication();

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<Error | string | null>(null);

  const checkIsAuthenticatedBySso = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      return await getSsoAccessToken();
    } catch (error) {
      // @ts-ignore  FIX-ME
      switch (error.code) {
        case SsoErrorCode.USER_NOT_SIGNED_IN:
        case SsoErrorCode.CLIENT_ERROR:
        case SsoErrorCode.GET_ACCESS_TOKEN_CALLED_BEFORE_PREVIOUS_COMPLETED:
        case SsoErrorCode.ZONE_CONFLICT:
          handleException(error);
          // @ts-ignore  FIX-ME
          setAuthError(new AuthenticationError(error.code));
          break;
        case SsoErrorCode.USER_ABORTED_SIGN_IN_OR_CONSENT:
          // User closed the authentication dialog without logging in. Don't show an error
          break;
        default:
          // For all other errors fall back to non-SSO sign-in.
          Sentry.captureMessage('falling back to MSAL authentication', {
            extra: { error },
          });
          setIsUsingFallback(true);
          break;
      }

      return null;
    } finally {
      setIsAuthenticating(false);
    }
  }, [setIsUsingFallback]);

  const authenticate = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const accessToken = await checkIsAuthenticatedBySso();
      // @ts-ignore  FIX-ME
      const decodedToken: any = jwtDecode(accessToken);
      setUser({
        id: decodedToken.oid,
        email: decodedToken.preferred_username,
        name: decodedToken.name,
        sub: decodedToken.sub,
      });
      setIsAuthenticated(!!accessToken);
    } catch (error) {
      handleException(error);
    } finally {
      setIsAuthenticating(false);
    }
  }, [checkIsAuthenticatedBySso, setIsAuthenticated, setUser]);

  useEffect(() => {
    if (isAuthenticated || isUsingFallback) {
      return;
    }

    authenticate().then(() => console.log('authenticated'));
  }, [
    authenticate,
    isAuthenticated,
    isUsingFallback,
    setIsAuthenticated,
    setIsUsingFallback,
  ]);

  if (isAuthenticated && !isUsingFallback) {
    return <>{children}</>;
  }

  if (isUsingFallback) {
    return <FallbackAuth>{children}</FallbackAuth>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      {!!authError && (
        <div className="m-4 flex justify-center">
          <ErrorBox error={authError} />
        </div>
      )}
      {isAuthenticating ? (
        <Spinner size={SpinnerSize.large} label="Authenticating..." />
      ) : (
        <div className="text-center">
          <p className="mb-10">Please log in to Office to continue.</p>
          <Button onClick={authenticate} size={ButtonSize.Large}>
            Log In
          </Button>
        </div>
      )}
    </div>
  );
}
