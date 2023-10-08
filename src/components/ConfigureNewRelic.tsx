import { useEffect } from 'react';
import { useAuthentication } from '../contexts/AuthenticationContext';

export function ConfigureNewRelic() {
  const { user } = useAuthentication();
  const { newrelic } = window;

  useEffect(() => {
    if (user && !!newrelic) {
      newrelic.setCustomAttribute('enduser.id', user.id);
    }
  }, [newrelic, user]);

  useEffect(() => {
    const { diagnostics } = Office.context;
    const { host, version, platform } = diagnostics;

    if (newrelic) {
      newrelic.setCustomAttribute('office.host', host.toString());
      newrelic.setCustomAttribute('office.version', version);
      newrelic.setCustomAttribute('office.platform', platform.toString());
    }
  }, [newrelic]);

  return null;
}
