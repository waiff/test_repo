import React, { ReactNode } from 'react';
import { BasicTooltip } from './tooltip/Tooltip';

export function DraftAction({
  title,
  testId,
  disabled,
  action,
  children,
  className,
  showTooltip = true,
}: {
  title: string;
  testId: string;
  disabled?: boolean;
  action: React.MouseEventHandler;
  children: ReactNode;
  className?: string;
  showTooltip?: boolean;
}) {
  const button = (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={action}
      className={className}
    >
      {children}
    </button>
  );

  return showTooltip ? (
    <BasicTooltip tooltip={title}>{button}</BasicTooltip>
  ) : (
    button
  );
}
