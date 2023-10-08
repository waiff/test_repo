import { handleException } from '../utils/ErrorUtils';
import type { SpellbookAddinCommand } from './types';
import { getCommandHandlerElement } from './utilities';

export const ExplainSection: SpellbookAddinCommand = {
  id: 'explainSection',
  handler: async (event: Office.AddinCommands.Event) => {
    try {
      const handlerElement = await getCommandHandlerElement();
      handlerElement?.dispatchEvent(new Event('explainSection'));
    } catch (error) {
      handleException(error);
    } finally {
      event.completed();
    }
  },
};
