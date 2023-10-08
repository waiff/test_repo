import { handleException } from '../utils/ErrorUtils';

const EIGHT_PAGES = 12_000;
const MAX_SEARCH_LENGTH = 200;

export class DocumentService {
  static cleanText(text: string) {
    return text.replace(/(\s)(\s)+/g, '$1$2');
  }

  static async writeToDocument(
    context: Word.RequestContext,
    text: string,
    { changeFontStyle = false }: { changeFontStyle?: boolean } = {},
  ) {
    const newSelection = context.document.getSelection();
    const insertedTextRange = newSelection.insertText(
      text,
      Word.InsertLocation.end,
    );
    if (changeFontStyle) {
      insertedTextRange.select();
      insertedTextRange.font.color = 'gray';
      insertedTextRange.select('End');
      await context.sync();
    }
    return insertedTextRange;
  }

  static async getTextBeforeAndAfterRange(
    context: Word.RequestContext,
    range: Word.Range,
    maxLength = EIGHT_PAGES,
  ) {
    const bodyStart = context.document.body.getRange('Start');
    const bodyEnd = context.document.body.getRange('End');
    const selectionBeforeCursor = range.getRange('Start').expandTo(bodyStart);
    const selectionAfterCursor = range.getRange('End').expandTo(bodyEnd);
    selectionBeforeCursor.load('text');
    selectionAfterCursor.load('text');
    await context.sync();

    const trimmedTextBefore = DocumentService.cleanText(
      selectionBeforeCursor.text,
    );
    const trimmedTextAfter = DocumentService.cleanText(
      selectionAfterCursor.text,
    );

    // Take max half the max length before the cursor for the prompt
    let textBefore = trimmedTextBefore.substring(
      trimmedTextBefore.length - maxLength / 2,
    );
    // Use the remaining text to fill up the suffix.
    const textAfter = trimmedTextAfter.substring(
      0,
      maxLength - textBefore.length,
    );
    // Add to the textBefore if we still have space left.
    textBefore = trimmedTextBefore.substring(
      trimmedTextBefore.length - (maxLength - textAfter.length),
    );

    return [textBefore, textAfter];
  }

  static async getTextBeforeAndAfterCursor(
    context: Word.RequestContext,
    maxLength = EIGHT_PAGES,
  ) {
    const selection = context.document.getSelection();
    return this.getTextBeforeAndAfterRange(context, selection, maxLength);
  }

  static async getSelection(context: Word.RequestContext) {
    const selection = context.document.getSelection();
    selection.load('text');
    await context.sync();
    return selection;
  }

  static async getDocumentText(context: Word.RequestContext) {
    const { body } = context.document;
    body.load('text');
    await context.sync();
    return body.text.trim();
  }

  static async isLongDocument(
    context: Word.RequestContext,
    maxLength = EIGHT_PAGES,
  ) {
    const documentText = await this.getDocumentText(context);
    const wordCount = documentText.split(/\s+/).length;
    return wordCount > maxLength;
  }

  static async getSelectedText(context: Word.RequestContext) {
    const selection = context.document.getSelection();
    selection.load('text');
    await context.sync();
    return DocumentService.cleanText(selection.text).trim();
  }

  static async replaceSelection(
    context: Word.RequestContext,
    selection: Word.Range,
    newText: string,
  ) {
    const newSelection = selection.insertText(
      newText,
      Word.InsertLocation.replace,
    );
    await context.sync();
    return newSelection;
  }

  static async selectRange(context: Word.RequestContext, range: Word.Range) {
    range.select();
    await context.sync();
  }

  static async findFirst(
    context: Word.RequestContext,
    searchText: string,
    range?: Word.Range,
    { ignorePunct, ignoreSpace, trimQuery } = {
      ignorePunct: true,
      ignoreSpace: true,
      trimQuery: true,
    },
  ): Promise<Word.Range | null> {
    try {
      const query = trimQuery ? searchText.trim() : searchText;
      if (query.length > MAX_SEARCH_LENGTH) {
        const startText = query.slice(0, MAX_SEARCH_LENGTH);
        const startRange = await this.findFirst(context, startText);
        if (!startRange) {
          throw new Error("Couldn't find start range for search");
        }
        const endText = searchText.slice(
          searchText.length - MAX_SEARCH_LENGTH,
          searchText.length,
        );
        const endRange = await this.findFirst(context, endText);
        if (!endRange) {
          throw new Error("Couldn't find start range for search");
        }
        return startRange.expandTo(endRange);
      }
      const searchRange = range ?? context.document.body;
      console.log(`searching for text (${query.length} chars)`);
      const searchResults = searchRange.search(query, {
        ignorePunct,
        ignoreSpace,
      });
      searchResults.load('length');
      await context.sync();
      console.log(`Found count: ${searchResults.items.length}`);
      return searchResults.items?.[0] ?? null;
    } catch (error) {
      handleException(error);
    }
    return null;
  }

  static async findAndSelect(context: Word.RequestContext, searchText: string) {
    try {
      const range = await this.findFirst(context, searchText);
      if (range) {
        range.select();
        return true;
      }
    } catch (error) {
      console.log(error);
    }
    return false;
  }

  static addSelectionChangedHandler(handler: any) {
    console.log('adding handler');
    Office.context.document.addHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      handler,
      {},
    );

    return () => {
      console.log('removing handler');
      Office.context.document.removeHandlerAsync(
        Office.EventType.DocumentSelectionChanged,
        {
          handler,
        },
      );
    };
  }

  static persistDocumentSpellbookState() {
    const autoShowString = 'Office.AutoShowTaskpaneWithDocument';

    const initialAutoShow =
      Office.context.document.settings.get(autoShowString);
    if (!initialAutoShow) {
      Office.context.document.settings.set(autoShowString, true);
      Office.context.document.settings.saveAsync((result) =>
        console.log(
          'saved spellbook visibility to document:',
          true,
          result.status,
        ),
      );
    }

    return Office.addin.onVisibilityModeChanged(({ visibilityMode }) => {
      const shouldAutoShow =
        Office.context.document.settings.get(autoShowString);
      const isVisible = visibilityMode === Office.VisibilityMode.taskpane;
      if (shouldAutoShow !== isVisible) {
        if (isVisible) {
          Office.context.document.settings.set(autoShowString, true);
        } else {
          Office.context.document.settings.remove(autoShowString);
        }
        Office.context.document.settings.saveAsync((result) =>
          console.log(
            'saved spellbook visibility to document:',
            isVisible,
            result.status,
          ),
        );
      }
    });
  }

  static async trackChanges(
    context: Word.RequestContext,
    action: () => Promise<void>,
  ) {
    const { document } = context;
    document.changeTrackingMode = Word.ChangeTrackingMode.trackAll;
    await context.sync();
    await action();
    document.changeTrackingMode = Word.ChangeTrackingMode.off;
    await context.sync();
  }
}
