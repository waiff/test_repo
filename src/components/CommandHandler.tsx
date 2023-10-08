import { useEffect, useMemo, useRef } from 'react';

import { useNavigate } from 'react-router-dom';
import { SpellSource } from '../common/SpellSource';
import { SpellEvents } from '../common/SpellEvents';
import { handleException } from '../utils/ErrorUtils';
import { useSpellbook } from '../contexts/SpellbookContext';
import { useRewrite } from '../hooks/useEdit';

export function CommandHandler() {
  const ref = useRef(null);
  const navigate = useNavigate();
  const { spells, isSummoningComplete } = useSpellbook();
  const rewrite = useRewrite({
    focusInput: () => PubSub.publishSync(SpellEvents.FocusInput),
  });

  const draftSpell = useMemo(
    () => spells.find((spell) => spell.key === 'quick-draft'),
    [spells],
  );

  const explainSectionSpell = useMemo(
    () => spells.find((spell) => spell.label.match(/explain section/i)),
    [spells],
  );

  useEffect(() => {
    const element = ref.current;
    const runQuickDraft = async (event: any) => {
      event.stopPropagation();
      try {
        navigate('/taskpane/assistant');
        // @ts-ignore  FIX-ME
        await draftSpell.action({ source: SpellSource.ContextMenu });
      } catch (error) {
        handleException(error);
      }
    };

    // @ts-ignore  FIX-ME
    element?.addEventListener('quickDraft', runQuickDraft);

    return () => {
      // @ts-ignore  FIX-ME
      element?.removeEventListener('quickDraft', runQuickDraft);
    };
  }, [ref, draftSpell, navigate]);

  useEffect(() => {
    const element = ref.current;

    // @ts-ignore  FIX-ME
    const runRewrite = (event) => {
      event.stopPropagation();
      try {
        navigate('/taskpane/assistant');
        rewrite({ source: SpellSource.ContextMenu });
      } catch (error) {
        handleException(error);
      }
    };

    // @ts-ignore  FIX-ME
    element?.addEventListener('rewrite', runRewrite);

    return () => {
      // @ts-ignore  FIX-ME
      element?.removeEventListener('rewrite', runRewrite);
    };
  }, [ref, rewrite, navigate]);

  useEffect(() => {
    const element = ref.current;

    // @ts-ignore  FIX-ME
    const runExplainSection = async (event) => {
      event.stopPropagation();
      try {
        navigate('/taskpane/assistant');
        // @ts-ignore  FIX-ME
        await explainSectionSpell.action({ source: SpellSource.ContextMenu });
      } catch (error) {
        handleException(error);
      }
    };

    // @ts-ignore  FIX-ME
    element?.addEventListener('explainSection', runExplainSection);

    return () => {
      // @ts-ignore  FIX-ME
      element?.removeEventListener('explainSection', runExplainSection);
    };
  }, [ref, explainSectionSpell, navigate]);

  if (!isSummoningComplete) {
    return null;
  }

  return <div id="command-handler-element" ref={ref} />;
}
