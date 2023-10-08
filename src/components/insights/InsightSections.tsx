import { Suggestions } from './Suggestions';
import { Terms } from './Terms';

export function InsightSections() {
  return (
    <div className="grid h-full w-full grid-rows-[repeat(3,_24px_fit-content(100%))] flex-col gap-2 pt-2">
      <Suggestions />
      <Terms />
    </div>
  );
}
