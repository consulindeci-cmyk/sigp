import React from 'react';
import { cn } from '@/lib/utils';

interface MasterDetailLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  master: React.ReactNode;
  detail: React.ReactNode;
  header?: React.ReactNode;
}

export function MasterDetailLayout({ master, detail, header, className, ...props }: MasterDetailLayoutProps) {
  return (
    <div className={cn("flex flex-col min-h-full bg-muted/10", className)} {...props}>
      {header && (
        <div className="shrink-0 bg-background border-b border-border z-10 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="mx-auto max-w-layout">
            {header}
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col lg:flex-row mx-auto w-full max-w-layout items-stretch">
        {/* Master Pane (Sidebar or List) */}
        <div className="shrink-0 w-full lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-border bg-background z-10">
          {master}
        </div>
        
        {/* Detail Pane (Content) */}
        <div className="flex-1 w-full p-4 sm:p-6 lg:p-8">
          <div className="w-full flex flex-col">
            {detail}
          </div>
        </div>
      </div>
    </div>
  );
}
