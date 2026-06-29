import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export function PageHeader({ title, description, badges, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      {breadcrumbs && <div className="text-sm text-muted-foreground">{breadcrumbs}</div>}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {badges && <div className="flex flex-wrap items-center gap-2 mb-2">{badges}</div>}
          <h1 className="text-2xl font-bold text-foreground m-0 tracking-tight">{title}</h1>
          {description && <div className="text-muted-foreground mt-1 text-sm">{description}</div>}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
