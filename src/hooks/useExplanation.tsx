import { useCallback } from 'react';

import { SpellSource } from '../common/SpellSource';
import { SpellAccepts } from '../services/RallyApiService';
import { useRallyApi } from './useRallyApi';

export function useExplanation() {
  const { summon, cast } = useRallyApi();

  return useCallback(
    async (document: string) => {
      const { spells } = await summon();
      const explanationSpell = spells.find(
        ({ name }) => name.toLowerCase() === 'explain to a 5 year old',
      );
      // @ts-ignore FIX-ME
      return cast(explanationSpell._id, SpellSource.DocumentData, {
        [SpellAccepts.full]: document,
      });
    },
    [cast, summon],
  );
}
