export function LoadingSpinner({
  color,
  variant,
}: {
  color?: string;
  variant?: string;
}) {
  let sizeClass;
  switch (variant) {
    case 'small':
      sizeClass = 'h-3 w-3';
      break;
    case 'large':
      sizeClass = 'h-5 w-5';
      break;
    default:
      sizeClass = 'h-4 w-4';
      break;
  }

  return (
    <div
      className={`inline-block ${sizeClass} animate-spin rounded-full border-[2px] border-current border-t-transparent`}
      role="status"
      aria-label="loading"
      style={{ color }}
    />
  );
}
