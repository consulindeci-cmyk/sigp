import React from 'react';
import WidgetWrapper from '../../common/WidgetWrapper';
import { MainRisk, WidgetState } from '../../../types/dashboard';

interface Props {
  data: MainRisk[];
  state?: WidgetState;
}

export default function MainRisksWidget({ data, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Risques Majeurs Actifs" state={state}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map(risk => (
          <div key={risk.id} style={{ fontSize: '12px', display: 'flex', gap: '8px' }}>
            <span style={{ color: risk.level === 'high' ? 'var(--red)' : 'var(--amber)' }}>●</span>
            <span>{risk.description}</span>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
