import React from 'react';
import WidgetWrapper from '../../common/WidgetWrapper';
import { Milestone, WidgetState } from '../../../types/dashboard';

interface Props {
  data: Milestone[];
  state?: WidgetState;
}

export default function MilestoneCalendarWidget({ data, state = 'success' }: Props) {
  // Format simple DD MMM
  const formatMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUI', 'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DÉC'];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]}`;
  };

  return (
    <WidgetWrapper title="Prochains Jalons" state={state}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ background: 'var(--navy-100)', color: 'var(--navy-700)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
              {formatMonth(m.date)}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>{m.title}</div>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
