import React from 'react';
import { Download, RefreshCw, Maximize2 } from 'lucide-react';

interface DashboardToolbarProps {
  title: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onFullscreen?: () => void;
}

export const DashboardToolbar = React.memo(({ title, onRefresh, onExport, onFullscreen }: DashboardToolbarProps) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '16px 24px', 
      background: 'var(--surface)', 
      borderBottom: '1px solid var(--line-strong)',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)' }}>
        {title}
      </h2>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {onRefresh && (
          <button 
            className="btn" 
            style={{ padding: '6px 12px', fontSize: '12px' }} 
            onClick={onRefresh}
            aria-label="Rafraîchir les données"
          >
            <RefreshCw size={14} /> Rafraîchir
          </button>
        )}
        {onExport && (
          <button 
            className="btn" 
            style={{ padding: '6px 12px', fontSize: '12px' }} 
            onClick={onExport}
            aria-label="Exporter les données"
          >
            <Download size={14} /> Exporter
          </button>
        )}
        {onFullscreen && (
          <button 
            className="btn" 
            style={{ padding: '6px 12px', fontSize: '12px' }} 
            onClick={onFullscreen}
            aria-label="Plein écran"
          >
            <Maximize2 size={14} /> Plein écran
          </button>
        )}
      </div>
    </div>
  );
});

DashboardToolbar.displayName = 'DashboardToolbar';
