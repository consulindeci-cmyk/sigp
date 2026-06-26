import React from 'react';
import WidgetWrapper from '../../common/WidgetWrapper';
import { WidgetState } from '../../../types/dashboard';

interface Props {
  physical: number;
  financial: number;
  state?: WidgetState;
}

export default function ProgressComparisonChart({ physical, financial, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Physique vs Financier" state={state}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span>Physique</span><span style={{ fontWeight: 600 }}>{physical}%</span>
        </div>
        <div style={{ height: '8px', background: 'var(--line)', borderRadius: '4px' }}>
          <div style={{ width: `${physical}%`, height: '100%', background: 'var(--navy-700)', borderRadius: '4px' }}></div>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span>Financier</span><span style={{ fontWeight: 600 }}>{financial}%</span>
        </div>
        <div style={{ height: '8px', background: 'var(--line)', borderRadius: '4px' }}>
          <div style={{ width: `${financial}%`, height: '100%', background: 'var(--green)', borderRadius: '4px' }}></div>
        </div>
      </div>
    </WidgetWrapper>
  );
}
