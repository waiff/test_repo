import { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSparkle } from '@fortawesome/sharp-solid-svg-icons';
import { faSparkles } from '@fortawesome/pro-duotone-svg-icons';

const SPELLBOOK_IS_STARTED_KEY = 'spellbook_is_started';

export function isStarted() {
  return !!localStorage.getItem(SPELLBOOK_IS_STARTED_KEY);
}

type WelcomeProps = {
  setIsStarted: (isStarted: boolean) => void;
};

function FeatureItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <FontAwesomeIcon
        icon={faSparkle}
        className="flex-none text-[8px] text-[#8CC2FE]"
      />
      <div className="flex-auto">{label}</div>
    </div>
  );
}

export function Welcome({ setIsStarted }: WelcomeProps) {
  const getStarted = useCallback(() => {
    localStorage.setItem(SPELLBOOK_IS_STARTED_KEY, '1');
    setIsStarted(true);
  }, [setIsStarted]);

  return (
    <div className="mt-9 flex flex-col px-10">
      <div className="text-[17px] font-bold">Welcome to Spellbook!</div>
      <div className="mt-3">
        Powered by GPT-4 and other large language models, Spellbook helps legal
        professionals draft and review contracts 3x faster.
      </div>
      <div className="mt-4">Spellbook can:</div>
      <div className="mt-4 self-center leading-6">
        <FeatureItem label="Draft new language" />
        <FeatureItem label="Suggest improvements" />
        <FeatureItem label="Spot unusual language" />
        <FeatureItem label="Answer questions" />
      </div>
      <button
        type="button"
        onClick={getStarted}
        className="mx-auto mt-10 flex items-center gap-2 rounded bg-rally-gradient px-4 py-2 text-[17px] font-medium text-white"
      >
        <FontAwesomeIcon icon={faSparkles} flip="horizontal" />
        Get Started
      </button>
      <div className="space-y-4 text-center text-[11px] text-gray-2">
        <br />
        By clicking Get Started, you agree to Spellbook&#39;s
        <br />
        <a
          className="text-blue-1"
          href="https://spellbook.legal/terms-of-service"
        >
          &nbsp;Terms of Service&nbsp;
        </a>
        and
        <a
          className="text-blue-1"
          href="https://spellbook.legal/privacy-policy"
        >
          &nbsp;Privacy Policy&nbsp;
        </a>
      </div>
    </div>
  );
}
