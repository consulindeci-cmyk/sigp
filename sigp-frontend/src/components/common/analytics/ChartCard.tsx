import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  flex?: string;
  minWidth?: string;
  minHeight?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export const ChartCard = React.memo(({
  title, subtitle, icon, children,
  flex = '1 1 400px',
  minWidth = '300px',
  minHeight = '300px',
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'Aucune donnée disponible',
}: ChartCardProps) => {
  return (
    <div
      className="bg-card border border-border rounded-lg p-5 flex flex-col shadow-sm"
      style={{ flex, minWidth }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {icon} {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex-1 relative flex flex-col" style={{ minHeight }}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Chargement...
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm bg-muted/5 rounded border border-dashed border-border">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
});

ChartCard.displayName = 'ChartCard';
