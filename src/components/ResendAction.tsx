import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateRight } from '@fortawesome/sharp-regular-svg-icons';

export function ResendAction({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="mx-auto mt-2.5 flex items-center justify-center gap-2 rounded-full bg-purple-1 px-2 py-1 text-white"
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      <FontAwesomeIcon icon={faArrowRotateRight} />
      {label}
    </button>
  );
}
