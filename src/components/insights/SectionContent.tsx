import { ReactNode } from 'react';

type Props = { children: ReactNode; isSectionExpanded: boolean };

export function SectionContent({ children, isSectionExpanded }: Props) {
  return (
    <div
      className={`ml-3 max-h-0 overflow-hidden border-l border-gray-4 pl-4 pr-3 transition-[max-height] duration-500 ${
        isSectionExpanded ? 'max-h-[100vh] overflow-y-auto' : ''
      }`}
    >
      {children}
    </div>
  );
}
