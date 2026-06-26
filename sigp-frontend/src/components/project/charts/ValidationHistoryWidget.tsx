import React from 'react';
import WidgetWrapper from '../../common/WidgetWrapper';
import { ProjectEvent, WidgetState } from '../../../types/dashboard';

interface Props {
  data: ProjectEvent[];
  state?: WidgetState;
}

export default function ValidationHistoryWidget({ data, state = 'success' }: Props) {
  const validations = data.filter(e => e.type === 'validation');
  return (
    <WidgetWrapper title="Historique des Validations" state={state}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '6px', top: '10px', bottom: '10px', width: '2px', background: 'var(--line-soft)' }}></div>
        {validations.map(v => (
          <div key={v.id} style={{ display: 'flex', gap: '12px', zIndex: 1 }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'var(--green)', border: '3px solid var(--canvas)', marginTop: '2px' }}></div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--slate)', fontWeight: 600 }}>{v.date}</div>
              <div style={{ fontSize: '12px', color: 'var(--ink)' }}>{v.description}</div>
            </div>
          </div>
        ))}
        {validations.length === 0 && <div style={{ fontSize: '12px', color: 'var(--slate)' }}>Aucune validation.</div>}
      </div>
    </WidgetWrapper>
  );
}
