import { useFeatureToggle } from '@flopflip/react-broadcast';
import { useMemo } from 'react';

// import { SpellTag } from "../RallyApiService";

export function useDevelopmentSpells() {
  const isDevelopmentSpellsEnabled = useFeatureToggle('developmentSpells');

  return useMemo(
    () =>
      isDevelopmentSpellsEnabled
        ? [
            // Place development spells here like so:
            // {
            //   key: "term-summary-v2",
            //   label: "Term Summary (v2.1)",
            //   tags: [SpellTag.development],
            //   action: termSummary,
            // },
          ]
        : [],
    [isDevelopmentSpellsEnabled],
  );
}
