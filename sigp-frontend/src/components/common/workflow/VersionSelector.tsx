import React from 'react';
import { GitCommit } from 'lucide-react';

export interface VersionItem {
  id: string;
  label: string; // ex: "v1.0"
  description?: string; // ex: "Version Initiale"
  isActive: boolean;
  statut: string;
}

interface VersionSelectorProps {
  versions: VersionItem[];
  selectedId: string;
  onChange: (id: string) => void;
}

export const VersionSelector = React.memo(({ versions, selectedId, onChange }: VersionSelectorProps) => {
  const selectedVersion = versions.find(v => v.id === selectedId) || versions.find(v => v.isActive);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
      <GitCommit size={13} color="var(--slate)" aria-hidden="true" />
      <select 
        value={selectedId} 
        onChange={(e) => onChange(e.target.value)}
        role="combobox"
        aria-label="Sélectionner une version"
        style={{ 
          border: 'none', 
          background: 'transparent', 
          fontWeight: 600, 
          color: 'var(--navy-900)', 
          outline: 'none', 
          cursor: 'pointer', 
          padding: 0 
        }}
      >
        {versions.map(v => (
          <option key={v.id} value={v.id}>
            {v.label} {v.description ? `- ${v.description}` : ''} {v.isActive ? '(Active)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
});

VersionSelector.displayName = 'VersionSelector';
