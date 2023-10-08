import 'core-js/actual';
import 'regenerator-runtime';
import './styles/index.css';
import './commands';

import { Configuration, PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { ErrorBoundary } from '@sentry/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';

import { SpellbookError } from './common/SpellbookError';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { Toaster } from './components/Toaster';
import { Login } from './routes/Login';
import { Root } from './routes/Root';
import { TaskPane } from './routes/TaskPane';
import { initializeSentry } from './utils/ErrorUtils';
import { Invite } from './routes/Invite';
import { UnsupportedEnvironment } from './components/UnsupportedEnvironment';
import { Tab } from './components/TabbedLayout';
import { Initializing } from './components/Initializing';
import { Library } from './components/Library';
import { LibraryManage } from './components/LibraryManage';
import { LibrarySearch } from './components/LibrarySearch';

initializeSentry();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new SpellbookError("Unable to render - Can't find root document");
}

const reactRoot = ReactDOM.createRoot(rootElement);

reactRoot.render(
  <React.StrictMode>
    <Initializing />
  </React.StrictMode>,
);

Office.onReady(({ host }) => {
  if (host !== Office.HostType.Word) {
    reactRoot.render(
      <React.StrictMode>
        <GlobalErrorBoundary>
          <UnsupportedEnvironment />
        </GlobalErrorBoundary>
      </React.StrictMode>,
    );
  } else {
    const msalConfiguration: Configuration = {
      auth: {
        clientId: import.meta.env.VITE_AUTH_CLIENT_ID,
        navigateToLoginRequestUrl: false,
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false,
      },
    };

    const publicClientApplication = new PublicClientApplication(
      msalConfiguration,
    );

    const router = createBrowserRouter([
      {
        path: '/',
        element: <Root />,
        errorElement: <ErrorBoundary />,
        children: [
          {
            element: <Navigate replace to="taskpane" />,
            index: true,
          },
          {
            path: 'taskpane',
            element: <TaskPane />,
            children: [
              {
                element: <Navigate replace to="assistant" />,
                index: true,
              },
              {
                path: ':tab',
                element: <Tab />,
                children: [
                  {
                    index: true,
                    element: <Tab />,
                  },
                  {
                    path: ':page',
                    element: <Library />,
                    children: [
                      {
                        path: 'search',
                        element: <LibrarySearch />,
                      },
                      {
                        path: 'manage',
                        element: <LibraryManage />,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            path: 'login',
            element: <Login />,
          },
          {
            path: 'invite',
            element: <Invite />,
          },
        ],
      },
    ]);

    reactRoot.render(
      <React.StrictMode>
        <MsalProvider instance={publicClientApplication}>
          <GlobalErrorBoundary>
            <Toaster />
            <RouterProvider router={router} />
          </GlobalErrorBoundary>
        </MsalProvider>
      </React.StrictMode>,
    );
  }
});
