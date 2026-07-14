import React from 'react';
import { cn } from '@/lib/utils';

interface ContentLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
}

export function ContentLayout({ children, header, scrollable = true, className, ...props }: ContentLayoutProps) {
  return (
    <div className={cn("flex flex-col min-w-0", scrollable ? "min-h-full" : "h-full overflow-hidden", className)} {...props}>
      {header && (
        <div className="shrink-0 border-b border-border bg-background px-4 py-4 sm:px-6 lg:px-8">
          {header}
        </div>
      )}
      <div className={cn("flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-20 lg:pb-20", !scrollable && "flex flex-col min-h-0")}>
        {/* max-w-layout = 100% fluid — Source unique de vérité définie dans tailwind.config.js */}
        <div className={cn("mx-auto w-full min-w-0 max-w-layout flex flex-col gap-6", !scrollable && "flex-1 min-h-0")}>
          {children}
        </div>
      </div>
    </div>
  );
}
