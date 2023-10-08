import { useEffect } from 'react';
import { ChatDots, Question } from '@phosphor-icons/react';
import { useFeatureToggle } from '@flopflip/react-broadcast';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { InvitePopover } from './InvitePopover';

export function Footer() {
  const { trackLink } = useAnalytics();
  const isClauseLibraryEnabled = useFeatureToggle('clauseLibrary');

  useEffect(() => {
    trackLink('a#get-help-link', 'Clicked Get Help');
    trackLink('a#provide-feedback-link', 'Clicked Provide Feedback');
  }, [trackLink]);

  return (
    <div className="flex h-full items-center justify-center gap-2.5 text-sm text-purple-1 ">
      <a
        id="provide-feedback-link"
        className="flex items-center justify-center gap-1 no-underline"
        href="https://form.typeform.com/to/ZfFTOebD"
      >
        <ChatDots size={19} />
        Feedback
      </a>
      {isClauseLibraryEnabled && <InvitePopover />}
      <a
        id="get-help-link"
        className="flex items-center justify-center gap-1 no-underline"
        href="https://rallynow.notion.site/Spellbook-Help-Center-545ac06ad19b4d2197547117b621c941"
      >
        <Question size={19} />
        Help
      </a>
    </div>
  );
}
