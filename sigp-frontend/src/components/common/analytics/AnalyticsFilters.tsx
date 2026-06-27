import React from 'react';
import { Filter } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  value: string;
}

interface AnalyticsFiltersProps {
  groups: FilterGroup[];
  onChange: (groupId: string, value: string) => void;
}

export const AnalyticsFilters = React.memo(({ groups, onChange }: AnalyticsFiltersProps) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: '12px 24px', 
      background: 'var(--canvas)', 
      borderBottom: '1px solid var(--line-strong)',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy-600)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <Filter size={14} aria-hidden="true" /> Filtres Analytiques :
      </div>
      
      {groups.map(group => (
        <select 
          key={group.id}
          value={group.value}
          onChange={(e) => onChange(group.id, e.target.value)}
          aria-label={`Filtrer par ${group.label}`}
          style={{ 
            padding: '6px 12px', 
            fontSize: '12px', 
            height: 'auto', 
            width: 'auto', 
            background: 'var(--surface)', 
            border: '1px solid var(--line-soft)',
            borderRadius: '4px',
            color: 'var(--ink)'
          }}
        >
          <option value="">{group.label} (Tous)</option>
          {group.options.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      ))}
    </div>
  );
});

AnalyticsFilters.displayName = 'AnalyticsFilters';
