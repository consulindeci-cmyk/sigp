import WidgetWrapper from '../../common/WidgetWrapper';
import { DistributionDataPoint, WidgetState } from '../../../types/dashboard';

interface Props {
  data: DistributionDataPoint[];
  state?: WidgetState;
}

export default function FundingChart({ data, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Financements (Bailleurs)" state={state}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '100%', flexWrap: 'wrap', gap: '16px', padding: '10px 0' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0, border: `12px solid ${data[1]?.color || 'var(--slate)'}`, borderTopColor: data[0]?.color || 'var(--navy-700)' }}></div>
        <div style={{ fontSize: '12px', color: 'var(--slate)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {data.map(item => (
             <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <div style={{ width: '8px', height: '8px', background: item.color, flexShrink: 0 }}></div> 
               <span className="truncate">{item.label}: {item.percentage}%</span>
             </div>
          ))}
        </div>
      </div>
    </WidgetWrapper>
  );
}
