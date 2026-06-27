import React from 'react';
import { Filter } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const FilterBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-4 bg-surface p-3 border-b border-line",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-navy-700 uppercase tracking-wide">
          <Filter className="h-4 w-4" /> Filtres :
        </div>
        <div className="flex flex-wrap gap-2 flex-1">
          {children}
        </div>
      </div>
    );
  }
);
FilterBar.displayName = 'FilterBar';
