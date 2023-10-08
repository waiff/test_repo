import * as Sentry from '@sentry/react';
import type { CaptureContext } from '@sentry/types';

import type { RallyApiUser } from '../common/RallyApiUser';

let sentryInitialized = false;

export function isOfficeError(error: any): error is Office.Error {
  if (typeof error === 'object') {
    return 'code' in error && 'message' in error && 'name' in error;
  }

  return false;
}

export function configureSentryEnvironmentScope() {
  const { diagnostics } = Office.context;
  const { host, version, platform } = diagnostics;

  Sentry.configureScope((scope) => {
    scope.setTags({
      officeHost: host.toString(),
      officeVersion: version,
      officePlatform: platform.toString(),
    });
  });
}

export function configureSentryUserScope(user: RallyApiUser) {
  Sentry.configureScope((scope) => {
    scope.setUser(user);
  });
}

export function initializeSentry() {
  try {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.init({
        debug: import.meta.env.DEV,
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
      });

      sentryInitialized = true;
      console.log('sentry initialized');
    } else {
      console.log('sentry initialization skipped - missing DSN');
    }
  } catch (error) {
    console.error('unable to initialize sentry', error);
  }
}

export function handleException(
  error: Error | string | Record<string, any> | unknown,
  captureContext?: CaptureContext,
) {
  const { newrelic } = window;
  const sentryEnabled = import.meta.env.VITE_SENTRY_DSN && sentryInitialized;

  if (error == null) {
    // this should never happen. This is just here to satisfy TypeScript since
    // typeof null === 'object'
    const errorObject = new Error(`trying to handle null error`);
    newrelic?.noticeError(errorObject);

    if (sentryEnabled) {
      Sentry.captureException(errorObject, captureContext);
    }

    console.error(errorObject);
  } else if (error instanceof Error) {
    newrelic?.noticeError(error);

    if (sentryEnabled) {
      Sentry.captureException(error, captureContext);
    }

    console.error(error);
  } else if (isOfficeError(error)) {
    const errorObject = new Error(`${error.name}: ${error.message}`);

    newrelic?.noticeError(errorObject, {
      'officeError.code': error.code,
      'officeError.name': error.name,
      'officeError.message': error.message,
    });

    if (sentryEnabled) {
      Sentry.captureException(errorObject, {
        extra: {
          'officeError.code': error.code,
          'officeError.name': error.name,
          'officeError.message': error.message,
        },
      });
    }

    console.error(errorObject);
  } else if (typeof error === 'string') {
    newrelic?.noticeError(new Error(error));

    if (sentryEnabled) {
      Sentry.captureException(new Error(error), captureContext);
    }

    console.error(error);
  } else if (typeof error === 'object') {
    newrelic?.noticeError(new Error('non-Error exception'));

    if (sentryEnabled) {
      Sentry.captureException(
        new Error('non-Error exception'),
        captureContext ?? { extra: error as Record<string, unknown> },
      );
    }

    if ('stack' in error) {
      console.error(error, error?.stack);
    }

    console.error(error);
  } else {
    // truly an unknown type. Should never get here, just log it and continue
    const errorObject = new Error(`trying to handle unknown error`);
    newrelic?.noticeError(errorObject);

    if (sentryEnabled) {
      Sentry.captureException(errorObject, captureContext);
    }

    console.error(error);
  }
}
