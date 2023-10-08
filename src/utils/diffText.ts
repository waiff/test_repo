import { diff_match_patch as DiffMatchPatch } from 'diff-match-patch';
import { v4 } from 'uuid';

export type Diff = { id: string; diffType: DiffType; value: string };

export enum DiffType {
  delete = -1,
  equal = 0,
  insert = 1,
}

const dmp = new DiffMatchPatch();

export function diffText(text1: string, text2: string): Diff[] {
  const diff = dmp.diff_main(text1, text2);
  dmp.diff_cleanupSemantic(diff);

  return diff.map(([diffType, value]) => ({ id: v4(), diffType, value }));
}
