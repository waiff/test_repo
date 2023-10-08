import * as Sentry from '@sentry/react';
import React, { ReactNode } from 'react';

export function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  return <Sentry.ErrorBoundary showDialog>{children}</Sentry.ErrorBoundary>;
}
