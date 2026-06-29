import React from 'react';
import { Download, RefreshCw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';

interface DashboardToolbarProps {
  title: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onFullscreen?: () => void;
}

export const DashboardToolbar = React.memo(({ title, onRefresh, onExport, onFullscreen }: DashboardToolbarProps) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 px-6 py-4 bg-card border-b border-border">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>

      <div className="flex gap-2 flex-wrap">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={onRefresh}
            aria-label="Rafraîchir les données"
          >
            Rafraîchir
          </Button>
        )}
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={onExport}
            aria-label="Exporter les données"
          >
            Exporter
          </Button>
        )}
        {onFullscreen && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Maximize2 size={14} />}
            onClick={onFullscreen}
            aria-label="Plein écran"
          >
            Plein écran
          </Button>
        )}
      </div>
    </div>
  );
});

DashboardToolbar.displayName = 'DashboardToolbar';
