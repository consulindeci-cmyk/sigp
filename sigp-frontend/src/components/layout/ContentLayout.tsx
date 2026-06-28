import React from 'react';
import { cn } from '@/lib/utils';

interface ContentLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
}

export function ContentLayout({ children, header, className, ...props }: ContentLayoutProps) {
  return (
    <div className={cn("flex flex-col min-h-full", className)} {...props}>
      {header && (
        <div className="shrink-0 border-b border-border bg-background px-4 py-4 sm:px-6 lg:px-8">
          {header}
        </div>
      )}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* max-w-layout = 100% fluid — Source unique de vérité définie dans tailwind.config.js */}
        <div className="mx-auto w-full max-w-layout flex flex-col gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}
