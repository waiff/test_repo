import { ExplainSection } from './explainSection';
import { QuickDraft } from './quick-draft';
import { Rewrite } from './rewrite';
import type { SpellbookAddinCommand } from './types';

export const commands: SpellbookAddinCommand[] = [
  QuickDraft,
  Rewrite,
  ExplainSection,
];
