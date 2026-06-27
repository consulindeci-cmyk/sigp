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
  emptyMessage = "Aucune donnée disponible"
}: ChartCardProps) => {
  return (
    <div style={{ 
      flex, 
      minWidth,
      background: 'var(--surface)', 
      padding: '20px', 
      borderRadius: '8px', 
      border: '1px solid var(--line-soft)', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon} {title}
          </h4>
          {subtitle && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--slate)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate)' }}>
            Chargement...
          </div>
        ) : isEmpty ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate)', background: 'var(--canvas)', borderRadius: '4px', border: '1px dashed var(--line-strong)' }}>
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
