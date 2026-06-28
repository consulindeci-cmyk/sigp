import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center animate-in fade-in-50",
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <h3 className="mt-2 text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            {description}
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';
