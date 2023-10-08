import React from 'react';

export function TermSummary({
  name,
  summary,
}: {
  name: string;
  summary: string;
}) {
  return (
    <p key={name} className="mb-2 last:mb-0">
      <span className="font-semibold">{name}</span>
      <br />
      {summary}
    </p>
  );
}
