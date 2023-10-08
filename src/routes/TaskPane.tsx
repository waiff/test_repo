import React, { useState } from 'react';

import { HelmetProvider } from 'react-helmet-async';
import RallyLogo from '../../assets/SpellbookByRally-small-logo.png';
import { AnalyticsProvider } from '../contexts/AnalyticsContext';
import { Authentication } from '../components/Authentication';
import { ConfigureSentryTaskpaneScope } from '../components/ConfigureSentryTaskpaneScope';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { FlagProvider } from '../components/FlagProvider';
import { Header } from '../components/Header';
import { Spellbook } from '../components/Spellbook';
import { isStarted, Welcome } from '../components/Welcome';
import { AuthenticationProvider } from '../contexts/AuthenticationContext';
import { SpellbookUserContextProvider } from '../contexts/SpellbookUserContext';
import { ConfigureNewRelic } from '../components/ConfigureNewRelic';
import { SpellbookStatusBanner } from '../components/SpellbookStatusBanner';
import { StartQuestionNPS } from '../components/StartQuestionNPS';

const title = 'Spellbook - By Rally';

export function TaskPane() {
  const [isSpellbookStarted, setIsSpellbookStarted] = useState(isStarted());

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header logo={RallyLogo} title={title} />
      {isSpellbookStarted ? (
        <AuthenticationProvider>
          <Authentication>
            <HelmetProvider>
              <SpellbookUserContextProvider>
                <AnalyticsProvider>
                  <ConnectionStatus />
                  <ConfigureSentryTaskpaneScope />
                  <ConfigureNewRelic />
                  <FlagProvider>
                    <StartQuestionNPS />
                    <SpellbookStatusBanner />
                    <Spellbook />
                  </FlagProvider>
                </AnalyticsProvider>
              </SpellbookUserContextProvider>
            </HelmetProvider>
          </Authentication>
        </AuthenticationProvider>
      ) : (
        <Welcome setIsStarted={setIsSpellbookStarted} />
      )}
    </div>
  );
}
