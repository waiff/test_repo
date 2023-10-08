import { faArrowRightFromBracket } from '@fortawesome/sharp-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { CastTarget } from '../hooks/useCastTargets';
import { BasicTooltip } from './tooltip/Tooltip';

const MAX_CONTEXT_LENGTH = 300;
const CONTEXT_TAIL_LENGTH = 50;

async function handleViewSelection(range: Word.Range) {
  return Word.run(range, async () => {
    range.select();
    return range.context.sync();
  });
}

export function CastTargetMessage({
  name,
  target,
}: {
  name: string;
  target: CastTarget;
}) {
  const { text, range } = target;
  const numWords = text.split(' ').length;

  const selectedText =
    text.length > MAX_CONTEXT_LENGTH
      ? `${text.slice(
          0,
          MAX_CONTEXT_LENGTH - CONTEXT_TAIL_LENGTH,
        )} ... ${text.slice(text.length - CONTEXT_TAIL_LENGTH, text.length)}`
      : text;

  return (
    <>
      <div>
        Casting {name} on the following selection ({numWords} words)...
      </div>
      <div className="m-2 mr-0 border-l-[1px] border-gray-3 pl-2 italic">
        {selectedText}
      </div>
      {!!range && (
        <div className="float-right mr-[-5px]">
          <BasicTooltip tooltip="Jump to Selection">
            <button
              type="button"
              onClick={() => handleViewSelection(range)}
              className="flex h-6 w-6 items-center justify-center rounded p-[6px] hover:bg-gray-5"
            >
              <FontAwesomeIcon
                className="text-sm text-gray-2 hover:text-gray-1"
                icon={faArrowRightFromBracket}
              />
            </button>
          </BasicTooltip>
        </div>
      )}
    </>
  );
}
