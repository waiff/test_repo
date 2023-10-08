import { handleException } from '../utils/ErrorUtils';
import type { SpellbookAddinCommand } from './types';
import { getCommandHandlerElement } from './utilities';

export const Rewrite: SpellbookAddinCommand = {
  id: 'rewrite',
  handler: async (event: Office.AddinCommands.Event) => {
    try {
      const handlerElement = await getCommandHandlerElement();
      handlerElement?.dispatchEvent(new Event('rewrite'));
    } catch (error) {
      handleException(error);
    } finally {
      event.completed();
    }
  },
};
