interface ProgressRingProps {
  size: number;
  percent: number;
  strokeWidth?: number | undefined;
  error?: boolean | undefined;
}

export function ProgressRing({
  size,
  percent,
  strokeWidth = 10,
  error,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div style={{ height: `${size}px`, width: `${size}px` }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            className="stroke-current text-gray-4"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={`stroke-current ${
              error ? 'text-feedback-error-medium' : 'text-blue-1'
            }`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </g>
      </svg>
    </div>
  );
}
