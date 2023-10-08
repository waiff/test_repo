import { useCallback, useEffect } from 'react';

import { SpellSource } from '../common/SpellSource';
import { useDocument } from '../contexts/DocumentContext';
import { useQuickDraft } from '../hooks/useQuickDraft';

export function SpellTriggers() {
  const { addSelectionChangedHandler } = useDocument();
  const draftNewText = useQuickDraft();

  const draftNewTextTrigger = useCallback(() => {
    const triggerPhrase = '+++';
    return Word.run(async (context) => {
      const cursor = context.document.getSelection().getRange('Start');
      const paragraphStart = cursor.paragraphs.getLast().getRange('Start');
      const selectionBeforeCursor = paragraphStart.expandTo(cursor);
      selectionBeforeCursor.load('text');
      await context.sync();

      if (!selectionBeforeCursor.text.endsWith(triggerPhrase)) {
        return;
      }

      const searchResults = selectionBeforeCursor.search(triggerPhrase);
      searchResults.load();
      await context.sync();

      const lastSearchResult = searchResults.items.pop();
      // @ts-ignore FIX-ME
      lastSearchResult.delete();
      await context.sync();

      await draftNewText({ source: SpellSource.TriggerPhrase });
    });
  }, [draftNewText]);

  useEffect(
    () => addSelectionChangedHandler(draftNewTextTrigger),
    [draftNewTextTrigger, addSelectionChangedHandler],
  );

  return null;
}
