import { DraftContextProvider } from '../contexts/DraftContext';
import { SuggestionsContextProvider } from '../contexts/SuggestionsContext';
import { SpellbookProvider } from '../contexts/SpellbookContext';
import { DocumentDataProvider } from '../contexts/DocumentDataContext';
import { DocumentProvider } from '../contexts/DocumentContext';
import { SpellbookLicenseCheck } from './SpellbookLicenseCheck';
import { SpellTriggers } from './SpellTriggers';
import { TabbedLayout } from './TabbedLayout';
import { TrialStatus } from './TrialStatus';
import { ResizeHandle } from './ResizeHandle';
import { DocumentSizeFilter } from './DocumentSizeFilter';
import { TabContextProvider } from './Tabs';
import { Footer } from './Footer';
import { CommandHandler } from './CommandHandler';
import { EagerLoadSuggestions } from './EagerLoadSuggestions';
import { SpellbookLayout } from './layout/SpellbookLayout';
import { ReviewContextProvider } from '../contexts/ReviewContext';
import { PlaybookContextProvider } from '../contexts/PlaybookContext';
import { LibraryContextProvider } from '../contexts/LibraryContext';

export function Spellbook() {
  return (
    <SpellbookLicenseCheck>
      <TrialStatus />
      <DocumentSizeFilter>
        <DocumentProvider>
          <DocumentDataProvider>
            <SpellbookProvider>
              <SpellTriggers />
              <SuggestionsContextProvider>
                <ReviewContextProvider origin="Review Tab">
                  <PlaybookContextProvider>
                    <LibraryContextProvider>
                      <DraftContextProvider>
                        <EagerLoadSuggestions />
                        <ResizeHandle />
                        <CommandHandler />
                        <SpellbookLayout
                          content={
                            <TabContextProvider>
                              <TabbedLayout />
                            </TabContextProvider>
                          }
                          footer={<Footer />}
                        />
                      </DraftContextProvider>
                    </LibraryContextProvider>
                  </PlaybookContextProvider>
                </ReviewContextProvider>
              </SuggestionsContextProvider>
            </SpellbookProvider>
          </DocumentDataProvider>
        </DocumentProvider>
      </DocumentSizeFilter>
    </SpellbookLicenseCheck>
  );
}
