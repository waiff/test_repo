import { useEffect } from 'react';

import { useAuthentication } from '../contexts/AuthenticationContext';
import {
  configureSentryEnvironmentScope,
  configureSentryUserScope,
} from '../utils/ErrorUtils';

export function ConfigureSentryTaskpaneScope() {
  const { user } = useAuthentication();

  useEffect(() => {
    configureSentryEnvironmentScope();
  }, []);

  useEffect(() => {
    if (user) {
      configureSentryUserScope(user);
    }
  }, [user]);

  return null;
}
