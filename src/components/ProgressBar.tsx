import { BasicTooltip } from './tooltip/Tooltip';

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <BasicTooltip tooltip={`${progress}%`} placement="bottom" anchorToCursor>
      <div className="w-full rounded bg-gray-6">
        <div
          className="h-4 rounded bg-gradient-to-r from-blue-1 to-purple-1 p-0.5 text-center text-xs leading-none text-white transition-all duration-200"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </BasicTooltip>
  );
}
