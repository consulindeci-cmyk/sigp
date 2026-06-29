import WidgetWrapper from '../../common/WidgetWrapper';
import { TimeSeriesDataPoint, WidgetState } from '../../../types/dashboard';

interface Props {
  data: TimeSeriesDataPoint[];
  state?: WidgetState;
}

export default function DisbursementChart({ data, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Évolution des Décaissements" state={state}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '4px', paddingBottom: '20px', paddingTop: '20px' }}>
        {data.map((point, i) => (
          <div key={i} style={{ width: '10%', height: `${point.value}px`, background: 'hsl(var(--primary))', borderRadius: '3px 3px 0 0', position: 'relative' }}>
            <span style={{ position: 'absolute', bottom: '-20px', fontSize: '10px', color: 'hsl(var(--muted-foreground))', width: '100%', textAlign: 'center' }}>{point.label}</span>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
