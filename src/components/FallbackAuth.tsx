import { useMsal } from '@azure/msal-react';
import jwtDecode from 'jwt-decode';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthentication } from '../contexts/AuthenticationContext';
import { handleException } from '../utils/ErrorUtils';
import { Button } from './Button';
import { ErrorBox } from './ErrorBox';
import { Spinner, SpinnerSize } from './Spinner';

// Error codes defined here: https://learn.microsoft.com/en-us/office/dev/add-ins/develop/dialog-handle-errors-events#errors-and-events-in-the-dialog-box
enum MsalAuthErrorCode {
  UNABLE_TO_LOAD_PAGE = 12002,
  REQUIRES_HTTPS = 12003,
  DIALOG_CLOSED = 12006,
}

type FallbackAuthProps = {
  children?: React.ReactNode;
};

type DialogMessageReceivedEvent = {
  message: string;
  origin: string;
};

type DialogEventReceivedEvent = { error: number };

class FallbackAuthError extends Error {
  public readonly name: string = 'FallbackAuthError';

  constructor(message: string, public readonly code: number) {
    super(message);
  }
}

export function FallbackAuth({ children }: FallbackAuthProps) {
  const { isAuthenticated, setUser, setIsAuthenticated } = useAuthentication();

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [fallbackAuthError, setFallbackAuthError] = useState<
    Error | string | null
  >(null);

  const loginDialog = useRef(null);

  const { instance } = useMsal();

  const closeDialog = useCallback(() => {
    try {
      // @ts-ignore  FIX-ME
      loginDialog.current?.close();
      loginDialog.current = null;
    } catch (error) {
      handleException(error);
    }
  }, [loginDialog]);

  const processEvent = useCallback(
    (arg: DialogEventReceivedEvent) => {
      try {
        const error = new FallbackAuthError(
          'Something went wrong logging you in. Please try again later.',
          arg.error,
        );
        handleException(error);

        if (arg.error !== MsalAuthErrorCode.DIALOG_CLOSED) {
          // Report errors other than 12006 (user closing the dialog box) to user
          setFallbackAuthError(error);
        }

        closeDialog();
      } finally {
        setIsAuthenticating(false);
      }
    },
    [closeDialog],
  );

  const processMessage = useCallback(
    (arg: DialogMessageReceivedEvent) => {
      try {
        console.log('Message received in processMessage');
        const messageFromDialog = JSON.parse(arg.message);

        closeDialog();

        if (messageFromDialog.status === 'success') {
          const { accountId, accessToken, cache } = messageFromDialog;
          if (!instance.getAllAccounts().length) {
            // the local storage cache wasn't updated by the dialog
            // (probably safari). Manually load the cache based on the response
            // from the dialog.
            Object.entries(cache).forEach(([key, value]) => {
              window.localStorage.setItem(
                key,
                typeof value === 'string' ? value : JSON.stringify(value),
              );
            });
          }

          const homeAccount = instance.getAccountByHomeId(accountId);
          instance.setActiveAccount(homeAccount);

          const decodedToken: any = jwtDecode(accessToken);
          setUser({
            id: decodedToken.oid,
            sub: decodedToken.sub,
            email: decodedToken.preferred_username,
            name: decodedToken.name,
          });
          setIsAuthenticated(!!accessToken);
          return;
        }

        setFallbackAuthError(
          JSON.stringify(messageFromDialog.error.toString()),
        );
      } finally {
        setIsAuthenticating(false);
      }
    },
    [closeDialog, instance, setIsAuthenticated, setUser],
  );

  const showFallbackDialog = useCallback(() => {
    setIsAuthenticating(true);
    setFallbackAuthError(null);
    const fullUrl = `${window.location.protocol}//${window.location.hostname}${
      window.location.port ? `:${window.location.port}` : ''
    }/login`;

    Office.context.ui.displayDialogAsync(
      fullUrl,
      { height: 60, width: 30 },
      (result) => {
        if (result.error) {
          // FIX-ME
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw result.error;
        }

        console.log('dialog has initialized. Wiring up events');
        // @ts-ignore  FIX-ME
        loginDialog.current = result.value;
        // @ts-ignore  FIX-ME
        loginDialog.current.addEventHandler(
          Office.EventType.DialogMessageReceived,
          processMessage,
        );
        // @ts-ignore  FIX-ME
        loginDialog.current.addEventHandler(
          Office.EventType.DialogEventReceived,
          processEvent,
        );
      },
    );
  }, [processEvent, processMessage]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    try {
      showFallbackDialog();
    } catch (error) {
      handleException(error);
    }
  }, [isAuthenticated, processMessage, showFallbackDialog]);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      {!!fallbackAuthError && (
        <div
          style={{
            display: 'flex',
            justifyItems: 'center',
            justifyContent: 'center',
            margin: '1rem',
          }}
        >
          <ErrorBox error={fallbackAuthError} />
        </div>
      )}
      {isAuthenticating ? (
        <Spinner size={SpinnerSize.large} label="Authenticating..." />
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p className="mb-10">Please log in to Office to continue.</p>
          <Button onClick={showFallbackDialog}>Log In</Button>
        </div>
      )}
    </div>
  );
}
