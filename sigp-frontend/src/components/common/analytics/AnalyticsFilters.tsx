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
    <div className="flex items-center flex-wrap gap-4 px-6 py-3 bg-muted/5 border-b border-border">
      <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
        <Filter size={13} aria-hidden="true" /> Filtres Analytiques :
      </div>

      {groups.map(group => (
        <select
          key={group.id}
          value={group.value}
          onChange={(e) => onChange(group.id, e.target.value)}
          aria-label={`Filtrer par ${group.label}`}
          className="h-8 px-3 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
