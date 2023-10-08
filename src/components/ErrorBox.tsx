import React from 'react';

interface ErrorBoxProps extends React.HTMLProps<HTMLDivElement> {
  error: Error | string;
}

export function ErrorBox({ error, ...props }: ErrorBoxProps) {
  return (
    <div
      className="flex min-w-[90%] rounded border-[0.5px] border-red-500 bg-red-100 px-3 py-2"
      {...props}
    >
      {typeof error === 'string' ? error : error.message}
    </div>
  );
}
