import { useEffect, useRef, useState } from 'react';
import { v4 } from 'uuid';
import { faHand } from '@fortawesome/sharp-regular-svg-icons';
import { faArrowDown } from '@fortawesome/sharp-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useReview } from '../contexts/ReviewContext';
import { ReviewItem } from './ReviewItem';

import './styles/review.css';

function ShimmerElement({ className }: { className: string }) {
  return <div className={`shimmer mb-3 h-4 rounded bg-gray-6 ${className}`} />;
}

function ReviewLoadingSkeleton({ numRows }: { numRows: number }) {
  const loadingSkeletonRows = Array(numRows)
    .fill(0)
    .map(() => (
      <div key={v4()} className="mb-6">
        <div className="flex items-center justify-between">
          <ShimmerElement className="w-1/2" />
          <div className="flex">
            <ShimmerElement className="w-4 rounded-full" />
            <ShimmerElement className="ml-4 w-4 rounded-full" />
          </div>
        </div>
        <ShimmerElement className="w-full" />
        <ShimmerElement className="w-1/4" />
        <ShimmerElement className="ml-auto w-1/4" />
      </div>
    ));
  return <>{loadingSkeletonRows}</>;
}

export function ReviewItems() {
  const {
    reviewItems,
    isReviewLoading,
    isInsertAllLoading,
    cancelInsertAllRef,
  } = useReview();
  const { trackEvent } = useAnalytics();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastItemRef = useRef<HTMLDivElement>(null);
  const [lastReviewItemVisible, setLastReviewItemVisible] = useState(false);

  const scrollToBottom = () => {
    containerRef?.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      setLastReviewItemVisible(entries[0].isIntersecting);
    });
    if (lastItemRef.current) {
      observer.observe(lastItemRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex h-full grow flex-col overflow-y-auto">
      <div
        ref={containerRef}
        className="flex grow flex-col gap-2 overflow-y-auto px-2 pb-2"
      >
        <TransitionGroup component={null}>
          {reviewItems.map((reviewItem) => {
            const { id } = reviewItem;
            return (
              <CSSTransition key={id} classNames="slide" timeout={300}>
                <ReviewItem key={id} reviewItem={reviewItem} />
              </CSSTransition>
            );
          })}
        </TransitionGroup>
        <div ref={lastItemRef} />
        {isReviewLoading && (
          <ReviewLoadingSkeleton
            numRows={Math.max(3 - reviewItems.length, 1)}
          />
        )}
      </div>
      {isInsertAllLoading && (
        <div className="absolute bottom-16 z-20 flex w-full flex-col items-center px-2">
          <button
            type="button"
            title="Stop"
            className="flex h-8 w-20 items-center justify-center rounded-full bg-gray-1 py-3 text-center text-white"
            onClick={() => {
              trackEvent('Cancel Insert All Review Items');
              cancelInsertAllRef.current = true;
            }}
          >
            <FontAwesomeIcon className="mr-2 text-xs" icon={faHand} />
            Stop
          </button>
        </div>
      )}
      {!!reviewItems.length &&
        !isInsertAllLoading &&
        !lastReviewItemVisible && (
          <div className="absolute bottom-16 z-20 self-center px-2">
            <button
              type="button"
              title="More comments"
              className="flex items-center justify-center rounded-full bg-gray-1 px-3 py-2 leading-4 text-white"
              onClick={scrollToBottom}
            >
              <FontAwesomeIcon className="mr-2 text-sm" icon={faArrowDown} />
              More comments
            </button>
          </div>
        )}
    </div>
  );
}
