'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:bg-neutral-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-orange-500',
              error
                ? 'border-red-300 dark:border-red-500/50'
                : 'border-gray-300 dark:border-neutral-700',
              icon ? 'pl-10' : '',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
