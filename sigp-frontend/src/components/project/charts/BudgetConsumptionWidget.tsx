import WidgetWrapper from '../../common/WidgetWrapper';
import { WidgetState } from '../../../types/dashboard';

interface Props {
  consumed: number;
  total: number;
  currency: string;
  state?: WidgetState;
}

export default function BudgetConsumptionWidget({ consumed, total, currency, state = 'success' }: Props) {
  // Format numbers to millions
  const format = (val: number) => `${currency}${(val / 1000000).toFixed(1)}M`;
  
  return (
    <WidgetWrapper title="Consommation Budget" state={state}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy-700)' }}>{format(consumed)}</div>
        <div style={{ fontSize: '12px', color: 'var(--slate)' }}>sur {format(total)}</div>
      </div>
    </WidgetWrapper>
  );
}
