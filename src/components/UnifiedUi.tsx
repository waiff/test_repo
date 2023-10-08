import './styles/spellbook.css';
import './styles/animation.css';

import { useSpellbook } from '../contexts/SpellbookContext';
import { ChatPane } from './ChatPane';
import { Omnibox } from './Omnibox';

export function UnifiedUi() {
  const { isDebugEnabled } = useSpellbook();

  return (
    <div
      className={`flex h-full flex-col overflow-y-hidden ${
        isDebugEnabled ? 'debug-enabled' : ''
      }`}
    >
      <ChatPane />
      <div className="mt-auto w-full">
        <Omnibox />
      </div>
    </div>
  );
}
