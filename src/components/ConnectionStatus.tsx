import { faTriangleExclamation } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';

import { useRallyApi } from '../hooks/useRallyApi';
import { handleException } from '../utils/ErrorUtils';

const INTERVAL_TIMEOUT = 20_000 + Math.floor(Math.random() * 5_000);

interface IConnectionStatus {
  api: boolean;
  openAi: boolean;
}

export function ConnectionStatus() {
  const { getStatus } = useRallyApi();

  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorReported, setErrorReported] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<IConnectionStatus>();

  const getStatusCallback = useCallback(async () => {
    setIsConnecting(true);
    try {
      const statusResponse = await getStatus();
      setConnectionStatus(statusResponse);
      setErrorReported(false);
    } catch (error) {
      setConnectionStatus({ api: false, openAi: false });

      if (!errorReported) {
        handleException(error);
        setErrorReported(true);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [errorReported, getStatus]);

  useEffect(() => {
    getStatusCallback().catch((error) => handleException(error));
  }, [getStatusCallback]);

  useEffect(() => {
    // FIX-ME
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const interval = window.setInterval(getStatusCallback, INTERVAL_TIMEOUT);

    return () => window.clearInterval(interval);
  });

  const showWarning =
    !!connectionStatus && (!connectionStatus.api || !connectionStatus.openAi);

  return (
    <div
      className="left-0 top-0 w-full overflow-hidden whitespace-nowrap bg-gray-1 p-1 text-center text-xs font-bold text-gray-4"
      hidden={!showWarning}
    >
      <div>
        <FontAwesomeIcon icon={faTriangleExclamation} />
        {isConnecting ? ' Connecting...' : ' Unable to connect to Spellbook'}
      </div>
    </div>
  );
}
