import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/sharp-solid-svg-icons';
import { useCallback } from 'react';
import { useDocumentData } from '../contexts/DocumentDataContext';
import { useSpellbook } from '../contexts/SpellbookContext';
import { InsightSections } from './insights/InsightSections';

export function Insights() {
  const { isDebugEnabled } = useSpellbook();
  const {
    status: { isDocumentEmpty },
    refreshDocumentText,
  } = useDocumentData();

  const handleRefresh = useCallback(() => {
    refreshDocumentText();
  }, [refreshDocumentText]);

  return (
    <>
      {isDocumentEmpty ? (
        <div className="mb-44 flex h-full w-full flex-col items-center justify-center">
          <div className="mb-10 text-sm text-gray-2">
            <p className="mb-4 whitespace-pre text-center leading-4">{`Insights will appear once there is\ncontent in your document.`}</p>
            <p className="whitespace-pre text-center leading-4">{`Click Refresh when you're ready to\ngenerate Insights.`}</p>
          </div>
          <button
            title="Refresh"
            type="button"
            className="rounded bg-purple-1 px-4 py-1 text-white"
            onClick={handleRefresh}
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className="mr-2 text-xs font-bold"
            />
            Refresh
          </button>
        </div>
      ) : (
        <div
          className={`h-full overflow-y-hidden ${
            isDebugEnabled ? 'debug-enabled' : ''
          }`}
        >
          <InsightSections />
        </div>
      )}
    </>
  );
}
