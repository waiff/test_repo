import { faTriangleExclamation } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useFlagVariation } from '@flopflip/react-broadcast';

export function SpellbookStatusBanner() {
  const spellbookStatusBanner = useFlagVariation('spellbookStatusBanner');

  return (
    <div>
      {spellbookStatusBanner && (
        <div className="left-0 top-0 w-full overflow-hidden whitespace-normal bg-gray-1 px-4 py-1 text-center text-xs font-bold leading-4 text-gray-4">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          {` ${spellbookStatusBanner}`}
        </div>
      )}
    </div>
  );
}
