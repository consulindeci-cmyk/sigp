import React from 'react';

interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
}

export const DashboardSection = React.memo(({ title, children }: DashboardSectionProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--navy-900)' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'stretch' }}>
        {children}
      </div>
    </div>
  );
});

DashboardSection.displayName = 'DashboardSection';
