import React, { forwardRef } from 'react';

export const Checkbox = forwardRef<
  HTMLInputElement,
  {
    id: string;
    label: string;
    value: string;
  }
>(({ id, label, value, ...props }, ref) => (
  <label htmlFor={id} className="flex items-center text-gray-2">
    {label}
    <input
      id={id}
      type="checkbox"
      className="form-checkbox relative ml-1 cursor-pointer rounded-sm border-gray-4 align-middle text-blue-2 outline-none focus:ring-0 focus:ring-offset-0"
      value={value}
      ref={ref}
      {...props}
    />
  </label>
));
