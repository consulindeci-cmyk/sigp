import React from 'react';
import WidgetWrapper from '../../common/WidgetWrapper';
import { EvmDataPoint, WidgetState } from '../../../types/dashboard';

interface Props {
  data: EvmDataPoint[];
  state?: WidgetState;
}

export default function EvmChart({ data, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Courbe en S (PV vs EV vs AC)" state={state}>
      <svg width="100%" height="180" viewBox="0 0 400 180" preserveAspectRatio="none">
        <path d="M0,180 Q100,160 200,90 T400,20" fill="none" stroke="var(--slate-light)" strokeWidth="3" strokeDasharray="5,5" />
        <path d="M0,180 Q100,170 180,120 T300,50" fill="none" stroke="var(--green)" strokeWidth="3" />
        <path d="M0,180 Q100,165 190,130 T300,40" fill="none" stroke="var(--red)" strokeWidth="3" />
      </svg>
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '10px', fontSize: '11px', fontWeight: 600 }}>
        <span style={{ color: 'var(--slate-light)' }}>- - PV</span>
        <span style={{ color: 'var(--green)' }}>— EV</span>
        <span style={{ color: 'var(--red)' }}>— AC</span>
      </div>
    </WidgetWrapper>
  );
}
