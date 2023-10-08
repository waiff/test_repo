import {
  AuthenticationResult,
  IPublicClientApplication,
} from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import React, { useEffect } from 'react';

import { SpellbookError } from '../common/SpellbookError';
import { handleException, isOfficeError } from '../utils/ErrorUtils';
import { Spinner, SpinnerSize } from '../components/Spinner';

async function handleResponse(
  msalInstance: IPublicClientApplication,
  response: AuthenticationResult | null,
) {
  if (response != null) {
    if (!response.account) {
      throw new SpellbookError('null account on authorization response');
    }

    Office.context.ui.messageParent(
      JSON.stringify({
        status: 'success',
        accessToken: response.accessToken,
        accountId: response.account.homeAccountId,
        // safari doesn't share localstorage - need to send cache to parent
        cache: window.localStorage,
      }),
    );
  } else {
    await msalInstance.loginRedirect({
      scopes: [import.meta.env.VITE_AUTH_CAST_SPELL_SCOPE],
    });
  }
}

async function handleRedirect(msalInstance: IPublicClientApplication) {
  // @ts-ignore
  if (Office.context.ui.messageParent) {
    const response = await msalInstance.handleRedirectPromise();
    await handleResponse(msalInstance, response);
  }
}

type MessageProps = {
  initialized: boolean;
  authenticated: boolean;
  authError: Office.Error | Error | null;
};

function Message({ initialized, authenticated, authError }: MessageProps) {
  if (authError) {
    return (
      <div className="mb-10">
        <h1 className="mb-5 text-2xl">
          Unexpected Authentication Error: {authError.name}
        </h1>
        <div className="mb-5">{authError.message}</div>
      </div>
    );
  }

  if (!initialized) {
    return <Spinner size={SpinnerSize.large} label="Initializing..." />;
  }

  if (!authenticated) {
    return <Spinner size={SpinnerSize.large} label="Authenticating..." />;
  }

  return (
    <div className="mb-10">
      <h1 className="mb-5 text-2xl">Log In Complete!</h1>
      <div className="mb-5">You may now close this window.</div>
    </div>
  );
}

export function Login() {
  const [initialized, setInitialized] = React.useState(false);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [authError, setAuthError] = React.useState<Office.Error | Error | null>(
    null,
  );

  const { instance } = useMsal();

  useEffect(() => {
    if (!instance) {
      return;
    }

    setInitialized(true);

    handleRedirect(instance)
      .then(() => {
        setAuthenticated(true);
      })
      .catch((error) => {
        if (isOfficeError(error) || error instanceof Error) {
          setAuthError(error);
        }

        handleException(error);
      });
  }, [instance]);

  return (
    <div className="mt-5 flex flex-col p-10">
      <Message
        initialized={initialized}
        authenticated={authenticated}
        authError={authError}
      />
    </div>
  );
}
