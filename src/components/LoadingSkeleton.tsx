import { v4 } from 'uuid';

export function LoadingSkeleton({
  numRows,
  styleClass,
  shimmer = true,
}: {
  numRows: number;
  styleClass?: string;
  shimmer?: boolean;
}) {
  const loadingSkeletonRows = Array(numRows)
    .fill(0)
    .map(() => (
      <div
        key={v4()}
        className={`${
          shimmer ? 'shimmer' : ''
        } mb-3 h-5 w-full rounded bg-gray-6 last:mb-0 ${styleClass}`}
      />
    ));
  return <>{loadingSkeletonRows}</>;
}
