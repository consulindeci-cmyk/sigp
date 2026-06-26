import React from 'react';
import WidgetWrapper from '../../common/WidgetWrapper';
import { CriticalActivity, WidgetState } from '../../../types/dashboard';

interface Props {
  data: CriticalActivity[];
  state?: WidgetState;
}

export default function CriticalActivitiesWidget({ data, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Activités Critiques (Retards)" state={state}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map(act => (
          <div key={act.id} style={{ 
            fontSize: '11px', padding: '8px', borderRadius: '4px', fontWeight: 600,
            background: act.status === 'blocked' ? 'var(--red-bg)' : 'var(--amber-bg)',
            color: act.status === 'blocked' ? 'var(--red)' : 'var(--amber)'
          }}>
            {act.code} - {act.name} (Retard {act.delayDays}j)
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
