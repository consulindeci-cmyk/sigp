import React from 'react';
import { cn } from '../../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink shadow-sm placeholder:text-slate focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-navy-500 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red focus-visible:ring-red",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
