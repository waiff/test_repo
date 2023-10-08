import { useCallback } from 'react';

import { DocumentService } from '../services/DocumentService';
import { SpellAccepts } from '../services/RallyApiService';
import { useDocumentData } from '../contexts/DocumentDataContext';

export type CastTarget = {
  text: string;
  range?: Word.Range;
};

export type DocumentTargets = {
  [key in SpellAccepts]?: CastTarget;
};

async function getSelectionCastTarget(
  context: Word.RequestContext,
): Promise<CastTarget> {
  const selection = await DocumentService.getSelection(context);
  const selectedText = DocumentService.cleanText(selection.text);

  return {
    text: selectedText,
    range: selection,
  };
}

async function getEightPageWindowCastTarget(context: Word.RequestContext) {
  const [textBeforeCursor, textAfterCursor] =
    await DocumentService.getTextBeforeAndAfterCursor(context);

  return {
    text: [textBeforeCursor, textAfterCursor].join(' '),
  };
}

export function useCastTargets() {
  const {
    documentData: {
      detailedTerms,
      nextDetailedTerms,
      classification,
      parties,
      representedParty,
    },
  } = useDocumentData();

  const getTargets = useCallback(
    async (
      context: Word.RequestContext,
      accepts?: SpellAccepts[],
    ): Promise<DocumentTargets> => {
      // default to sending eight-page window and selection
      if (!accepts?.length) {
        return {
          [SpellAccepts.eightPageWindow]: await getEightPageWindowCastTarget(
            context,
          ),
          [SpellAccepts.selection]: await getSelectionCastTarget(context),
        };
      }

      const targets: DocumentTargets = {};

      if (accepts.includes(SpellAccepts.selection)) {
        targets[SpellAccepts.selection] = await getSelectionCastTarget(context);
      }

      if (accepts.includes(SpellAccepts.eightPageWindow)) {
        targets[SpellAccepts.eightPageWindow] =
          await getEightPageWindowCastTarget(context);
      }

      if (
        accepts.includes(SpellAccepts.beginning) ||
        accepts.includes(SpellAccepts.full)
      ) {
        const documentText = await DocumentService.getDocumentText(context);
        targets[SpellAccepts.full] = { text: documentText };
      }

      if (
        accepts.includes(SpellAccepts.termSummary) &&
        (detailedTerms || nextDetailedTerms)
      ) {
        const termSummary = detailedTerms ?? (await nextDetailedTerms);
        targets[SpellAccepts.termSummary] = {
          text: JSON.stringify(termSummary?.map(({ source, ...term }) => term)),
        };
      }

      if (accepts.includes(SpellAccepts.parties) && parties) {
        targets[SpellAccepts.parties] = { text: JSON.stringify(parties) };
      }

      if (accepts.includes(SpellAccepts.classification) && classification) {
        targets[SpellAccepts.classification] = { text: classification };
      }

      if (accepts.includes(SpellAccepts.representedParty) && representedParty) {
        targets[SpellAccepts.representedParty] = {
          text: JSON.stringify(representedParty),
        };
      }

      return targets;
    },
    [
      detailedTerms,
      parties,
      classification,
      nextDetailedTerms,
      representedParty,
    ],
  );

  const loadTargets = useCallback(
    async (context: Word.RequestContext, accepts?: SpellAccepts[]) => {
      const target = await getTargets(context, accepts);
      Object.values(target).forEach(({ range }) => range?.track());
      return target;
    },
    [getTargets],
  );

  return { getTargets, loadTargets };
}
