import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function DashboardLayout({ children, header, sidebar, className, ...props }: DashboardLayoutProps) {
  return (
    <div className={cn("flex flex-col min-h-full bg-muted/10", className)} {...props}>
      {header && (
        <div className="shrink-0">
          {header}
        </div>
      )}
      <div className="flex-1 flex items-stretch">
        {sidebar && (
          <div className="shrink-0 w-64 border-r border-border bg-background hidden lg:block">
            {sidebar}
          </div>
        )}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-layout flex flex-col gap-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
