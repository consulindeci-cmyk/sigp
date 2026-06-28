import React from 'react';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FilterBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-background p-4 border-b border-border shadow-sm",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
          <Filter className="h-4 w-4" /> Filtres
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 w-full sm:w-auto">
          {children}
        </div>
      </div>
    );
  }
);
FilterBar.displayName = 'FilterBar';
