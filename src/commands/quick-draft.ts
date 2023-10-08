import { handleException } from '../utils/ErrorUtils';
import type { SpellbookAddinCommand } from './types';
import { getCommandHandlerElement } from './utilities';

export const QuickDraft: SpellbookAddinCommand = {
  id: 'quickDraft',
  handler: async (event: Office.AddinCommands.Event) => {
    try {
      const handlerElement = await getCommandHandlerElement();
      handlerElement?.dispatchEvent(new Event('quickDraft'));
    } catch (error) {
      handleException(error);
    } finally {
      event.completed();
    }
  },
};
