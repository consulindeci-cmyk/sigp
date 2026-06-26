import React from 'react';
import WidgetWrapper from '../../common/WidgetWrapper';
import { WidgetState } from '../../../types/dashboard';

interface Props {
  state?: WidgetState;
}

export default function ProjectMapWidget({ state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Zones d'Intervention" state={state}>
      <div style={{ width: '100%', height: '100%', minHeight: '200px', background: 'var(--navy-100)', borderRadius: '4px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--navy-500)" strokeWidth="1" width="48" height="48" opacity="0.5"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
        <div style={{ position: 'absolute', top: '30%', left: '40%', width: '12px', height: '12px', background: 'var(--red)', borderRadius: '50%', border: '2px solid white' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '60%', width: '12px', height: '12px', background: 'var(--amber)', borderRadius: '50%', border: '2px solid white' }}></div>
      </div>
    </WidgetWrapper>
  );
}
