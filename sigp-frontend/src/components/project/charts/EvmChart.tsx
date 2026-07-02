import WidgetWrapper from '../../common/WidgetWrapper';
import { EvmDataPoint, WidgetState } from '../../../types/dashboard';

interface Props {
  data: EvmDataPoint[];
  state?: WidgetState;
}

export default function EvmChart({ data: _data, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Courbe en S (PV vs EV vs AC)" state={state}>
      <div className="flex flex-col h-full w-full relative">
        <svg width="100%" height="180" viewBox="0 0 400 180" preserveAspectRatio="none" className="shrink-0">
          <path d="M0,180 Q100,160 200,90 T400,20" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="3" strokeDasharray="5,5" />
          <path d="M0,180 Q100,170 180,120 T300,50" fill="none" stroke="hsl(var(--success))" strokeWidth="3" />
          <path d="M0,180 Q100,165 190,130 T300,40" fill="none" stroke="hsl(var(--destructive))" strokeWidth="3" />
        </svg>
        <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] font-semibold p-2 pt-0 mt-auto">
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>- - PV</span>
          <span style={{ color: 'hsl(var(--success))' }}>— EV</span>
          <span style={{ color: 'hsl(var(--destructive))' }}>— AC</span>
        </div>
      </div>
    </WidgetWrapper>
  );
}
