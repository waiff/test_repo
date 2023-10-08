import { ReactNode, useEffect } from 'react';

import {
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import { useFeatureToggle } from '@flopflip/react-broadcast';
import { useDraft } from '../contexts/DraftContext';
import { InvitePopover } from './InvitePopover';
import { LoadingIndicator } from './LoadingIndicator';
import { useTabs, Tabs } from './Tabs';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useSuggestions } from '../contexts/SuggestionsContext';
import { Insights } from './Insights';
import { Review } from './Review';
import { Draft } from './Draft';
import { Assistant } from './Assistant';
import { PartySelect } from './PartySelect';
import { Library } from './Library';

function TabLink({
  name,
  to,
  loading = false,
  children,
}: {
  name: Tabs;
  to: string;
  loading?: boolean;
  children: ReactNode;
}) {
  const { isUnread, markUnread } = useTabs();
  const { trackEvent } = useAnalytics();
  const { isLoading: isSuggestionsLoading, isSuggestedClausesLoading } =
    useSuggestions();

  useEffect(() => {
    if (!isSuggestionsLoading && !isSuggestedClausesLoading) {
      markUnread(Tabs.Insights);
    }
  }, [isSuggestionsLoading, isSuggestedClausesLoading, markUnread]);

  return (
    <NavLink
      onClick={(e) => {
        trackEvent?.(`Viewed ${name} Tab`);
        e.stopPropagation();
      }}
      to={to}
      className={({ isActive }) =>
        `mr-4 flex cursor-pointer items-center px-2 py-3 align-middle leading-4 max-[375px]:mr-0 ${
          isActive ? 'font-bold text-black' : 'font-medium text-gray-2'
        }`
      }
    >
      <div className="relative">
        {children}
        {isUnread(name) && (
          <>
            <div className="animate-ping-short absolute -right-1.5 top-0 h-1.5 w-1.5 rounded-full bg-red-500" />
            <div className="absolute -right-1.5 top-0 h-1.5 w-1.5 rounded-full bg-red-500 " />
          </>
        )}
      </div>
      {loading && <LoadingIndicator />}
    </NavLink>
  );
}

export function TabbedLayout() {
  const { isDraftLoading } = useDraft();
  const isReviewsEnabled = useFeatureToggle('reviews');
  const isClauseLibraryEnabled = useFeatureToggle('clauseLibrary');
  const { tab } = useParams();

  return (
    <div className="flex h-full flex-col overflow-y-hidden">
      <div className="flex-none">
        <div className="flex flex-wrap items-center">
          <TabLink name={Tabs.Assistant} to="/taskpane/assistant">
            Spells
          </TabLink>
          {isReviewsEnabled && (
            <TabLink name={Tabs.Review} to="/taskpane/review">
              Review
            </TabLink>
          )}
          <TabLink name={Tabs.Insights} to="/taskpane/insights">
            Insights
          </TabLink>
          <TabLink
            name={Tabs.Draft}
            to="/taskpane/draft"
            loading={isDraftLoading}
          >
            Draft
          </TabLink>
          {isClauseLibraryEnabled && (
            <TabLink name={Tabs.Library} to="/taskpane/library">
              Library
            </TabLink>
          )}
          {!isClauseLibraryEnabled && (
            <div className="ml-auto flex justify-center self-center">
              <InvitePopover />
            </div>
          )}
        </div>
      </div>
      {tab !== Tabs.Library.toLowerCase() && <PartySelect />}
      <Routes>
        <Route
          path="/taskpane/library/:page"
          element={
            isClauseLibraryEnabled ? (
              <Library />
            ) : (
              <Navigate to="/taskpane/assistant" />
            )
          }
        />
      </Routes>
      <Outlet />
    </div>
  );
}

export function Tab() {
  const { tab } = useParams();
  const isReviewsEnabled = useFeatureToggle('reviews');
  const isClauseLibraryEnabled = useFeatureToggle('clauseLibrary');

  return (
    <>
      <Assistant active={tab === Tabs.Assistant.toLowerCase()} />
      {tab === Tabs.Insights.toLowerCase() && <Insights />}
      {tab === Tabs.Review.toLowerCase() && isReviewsEnabled && <Review />}
      {tab === Tabs.Draft.toLowerCase() && <Draft />}
      {tab === Tabs.Library.toLowerCase() && isClauseLibraryEnabled && (
        <Library />
      )}
    </>
  );
}
