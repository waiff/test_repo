import {
  faAngleRight,
  faArrowsRotate,
  faArrowsUpDown,
} from '@fortawesome/sharp-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { fakCollapseAll } from '../../icons/fakSpellIcons';
import { BasicTooltip } from '../tooltip/Tooltip';

type HeaderProps = {
  title: string;
  isSectionExpanded: boolean;
  setSectionExpanded: (expanded: boolean) => void;
  isLoading: boolean;
  count?: number;
  refresh?: () => void;
  isAllExpanded?: boolean;
  expandAll?: () => void;
  collapseAll?: () => void;
};

export function Header({
  title,
  isSectionExpanded,
  setSectionExpanded,
  isLoading,
  count,
  refresh,
  isAllExpanded,
  expandAll,
  collapseAll,
}: HeaderProps) {
  return (
    <div className="flex w-full items-center px-3 font-bold ">
      <button
        type="button"
        role="row"
        className="flex items-center"
        onClick={() => setSectionExpanded(!isSectionExpanded)}
      >
        <FontAwesomeIcon
          className={`mr-3 ${isSectionExpanded ? '-rotate-90' : ''}`}
          icon={faAngleRight}
        />
        <div className="text-left font-semibold">{title}</div>
      </button>
      {!isLoading && (
        <>
          {count !== null ? (
            <div className="ml-1 rounded-[1px] bg-gray-6 px-1 font-medium text-gray-1">
              {count}
            </div>
          ) : null}
          {isSectionExpanded && (
            <div className="ml-auto flex gap-2 text-purple-1">
              {!!refresh && (
                <BasicTooltip tooltip="Refresh">
                  <button type="button" onClick={refresh}>
                    <FontAwesomeIcon icon={faArrowsRotate} />
                  </button>
                </BasicTooltip>
              )}
              {!!collapseAll && !!expandAll && (
                <>
                  {isAllExpanded ? (
                    <BasicTooltip tooltip="Collapse All">
                      <button
                        type="button"
                        onClick={collapseAll}
                        title="Collapse All"
                        className="w-3.5"
                      >
                        <FontAwesomeIcon icon={fakCollapseAll as IconProp} />
                      </button>
                    </BasicTooltip>
                  ) : (
                    <BasicTooltip tooltip="Expand All">
                      <button
                        type="button"
                        onClick={expandAll}
                        title="Expand All"
                        className="w-3.5"
                      >
                        <FontAwesomeIcon icon={faArrowsUpDown} />
                      </button>
                    </BasicTooltip>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
