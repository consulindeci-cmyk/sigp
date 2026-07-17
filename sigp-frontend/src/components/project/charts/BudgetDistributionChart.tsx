import WidgetWrapper from '../../common/WidgetWrapper';
import { DistributionDataPoint, WidgetState } from '../../../types/dashboard';

interface Props {
  data: DistributionDataPoint[];
  state?: WidgetState;
}

export default function BudgetDistributionChart({ data, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Budget par Composante" state={state}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '100%', flexWrap: 'wrap', gap: '16px', padding: '10px 0' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
          borderWidth: '12px',
          borderStyle: 'solid',
          borderTopColor: data[2]?.color || 'hsl(var(--warning))',
          borderRightColor: data[1]?.color || 'hsl(var(--success))',
          borderBottomColor: data[0]?.color || 'hsl(var(--primary))',
          borderLeftColor: data[0]?.color || 'hsl(var(--primary))',
        }} />
        <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {data.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', background: item.color, flexShrink: 0 }} />
              <span className="truncate">{item.label}: {item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetWrapper>
  );
}
