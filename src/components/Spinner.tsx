export const SpinnerSize: Record<string, string> = {
  large: 'w-7 h-7',
  default: 'w-5 h-5',
};

export function Spinner({
  size = SpinnerSize.default,
  label,
}: {
  size?: keyof typeof SpinnerSize;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`box-border animate-spin-gravity rounded-full border-[1.5px] border-[##C7E0F4] border-t-[#0078D4] ${
          SpinnerSize[size] ?? SpinnerSize.default
        }`}
      />
      {label && <div className="mt-2 text-xs text-[#0078D4]">{label}</div>}
    </div>
  );
}
