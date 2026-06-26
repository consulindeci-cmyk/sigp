import React from 'react';
import WidgetWrapper from '../../common/WidgetWrapper';
import { DistributionDataPoint, WidgetState } from '../../../types/dashboard';

interface Props {
  data: DistributionDataPoint[];
  state?: WidgetState;
}

export default function BudgetDistributionChart({ data, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Budget par Composante" state={state}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: `12px solid ${data[0]?.color || 'var(--navy-500)'}`, borderTopColor: data[2]?.color || 'var(--amber)', borderRightColor: data[1]?.color || 'var(--green)', margin: '0 10px' }}></div>
        <div style={{ fontSize: '12px', color: 'var(--slate)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {data.map(item => (
             <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <div style={{ width: '8px', height: '8px', background: item.color }}></div> 
               {item.label}: {item.percentage}%
             </div>
          ))}
        </div>
      </div>
    </WidgetWrapper>
  );
}
