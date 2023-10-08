import { ReactNode } from 'react';

export function SpellbookLayout({
  content,
  footer,
}: {
  content: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-stretch overflow-y-hidden">
      <div className="basis-full overflow-y-auto">{content}</div>
      {footer && <div className="h-10 grow-0">{footer}</div>}
    </div>
  );
}
