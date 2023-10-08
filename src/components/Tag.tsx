import React, { HTMLProps } from 'react';

import { SpellTag } from '../services/RallyApiService';

function tagText(tag: SpellTag) {
  switch (tag) {
    case SpellTag.alpha: {
      return 'Alpha';
    }
    case SpellTag.beta: {
      return 'Beta';
    }
    case SpellTag.new: {
      return 'New!';
    }
    case SpellTag.development: {
      return 'Dev';
    }
    case SpellTag.custom: {
      return 'Custom';
    }
    default: {
      return 'Unknown';
    }
  }
}

export function Tag({
  tag,
  ...props
}: { tag: SpellTag } & HTMLProps<HTMLDivElement>) {
  return (
    <div
      className="ml-1 flex h-full items-center justify-center rounded-lg  bg-purple-1 px-2 text-xs leading-[18px] text-white"
      {...props}
    >
      {tagText(tag)}
    </div>
  );
}
