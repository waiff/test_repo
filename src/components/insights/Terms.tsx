import {
  faArrowRightFromBracket,
  faSquareExclamation,
} from '@fortawesome/sharp-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useMemo, useState } from 'react';
import { useDocument } from '../../contexts/DocumentContext';

import { useDocumentData } from '../../contexts/DocumentDataContext';
import { TermSummary } from '../../services/RallyApiService';
import { ExpandableItem, useExpandableItemList } from '../ExpandableItem';
import { Header } from './Header';
import { SectionContent } from './SectionContent';
import { LoadingSkeleton } from '../LoadingSkeleton';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { BasicTooltip } from '../tooltip/Tooltip';

type TermProps = {
  term: TermSummary;
  expanded: boolean;
  toggle: () => void;
};

export function Term({ term, expanded, toggle }: TermProps) {
  const { name, summary, source } = term;
  const { selectText } = useDocument();
  const { trackEvent } = useAnalytics();

  return (
    <ExpandableItem
      title={name}
      description={summary}
      expanded={expanded}
      toggle={toggle}
      actions={
        source ? (
          <BasicTooltip tooltip="Navigate">
            <button
              type="button"
              onClick={() => {
                trackEvent?.('Go to Term', { name });
                selectText(source);
              }}
              title="Navigate"
            >
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
            </button>
          </BasicTooltip>
        ) : null
      }
    />
  );
}

export function Terms() {
  const {
    documentData: { detailedTerms },
    updateDocumentData,
    status: { isTermsLoading, isTermsError },
  } = useDocumentData();
  const keys = useMemo(
    () => detailedTerms?.map(({ id }) => id) ?? [],
    [detailedTerms],
  );
  const { expandAll, collapseAll, isExpanded, toggle, isAllExpanded } =
    useExpandableItemList(keys);
  const { trackEvent } = useAnalytics();
  const handleRefresh = useCallback(() => {
    trackEvent?.('Refresh Terms');
    updateDocumentData({ detailedTerms: null, nextDetailedTerms: null });
  }, [updateDocumentData, trackEvent]);
  const [isSectionExpanded, setSectionExpanded] = useState(true);

  return (
    <>
      <Header
        title="Terms"
        isSectionExpanded={isSectionExpanded}
        setSectionExpanded={(expanded: boolean) => {
          trackEvent?.(`Terms Section ${expanded ? 'Expanded' : 'Collapsed'}`);
          setSectionExpanded(expanded);
        }}
        isLoading={isTermsLoading}
        refresh={handleRefresh}
        isAllExpanded={isAllExpanded}
        expandAll={() => {
          trackEvent?.('Terms Expand All');
          expandAll();
        }}
        collapseAll={() => {
          trackEvent?.('Terms Collapse All');
          collapseAll();
        }}
      />
      <SectionContent isSectionExpanded={isSectionExpanded}>
        {detailedTerms && !isTermsError && (
          <div className="flex flex-col gap-2">
            {detailedTerms?.map((term) => {
              const { id } = term;
              return (
                <Term
                  key={id}
                  term={term}
                  expanded={isExpanded(id)}
                  toggle={() => {
                    if (!isExpanded(id)) {
                      trackEvent?.('Term Expanded');
                    }
                    toggle(id);
                  }}
                />
              );
            })}
          </div>
        )}
        {isTermsLoading && !isTermsError && (
          <LoadingSkeleton
            numRows={3}
            styleClass="h-8 rounded-[8px]"
            shimmer={isSectionExpanded}
          />
        )}
        {isTermsError && !isTermsLoading && (
          <div className="flex h-full w-full flex-col items-center justify-center py-3 text-gray-2">
            <FontAwesomeIcon
              icon={faSquareExclamation}
              className="mb-[12px] h-9 w-full"
            />
            <p className="whitespace-pre text-center text-sm leading-4">
              {`Unable to load Terms at this\ntime. Please refresh the section\nor try again later.`}
            </p>
          </div>
        )}
      </SectionContent>
    </>
  );
}
