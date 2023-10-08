import React from 'react';

import { UnifiedUi } from './UnifiedUi';

export function Assistant({ active }: { active: boolean }) {
  return (
    <div className={`h-full overflow-y-hidden ${active ? '' : 'hidden'}`}>
      <UnifiedUi />
    </div>
  );
}
