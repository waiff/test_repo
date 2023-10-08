import { ComponentProps } from 'react';

export const ButtonSize: Record<string, string> = {
  large: 'py-2 px-4 text-base',
  default: 'py-1 px-2',
};

export function Button({
  className,
  children,
  size = ButtonSize.default,
  ...props
}: {
  size?: keyof typeof ButtonSize;
} & ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={`mx-auto flex items-center gap-2 rounded bg-rally-gradient text-white ${
        ButtonSize[size] ?? ButtonSize.default
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
