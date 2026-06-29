import WidgetWrapper from '../../common/WidgetWrapper';
import { WidgetState } from '../../../types/dashboard';

interface Props {
  state?: WidgetState;
}

export default function ProjectMapWidget({ state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Zones d'Intervention" state={state}>
      <div style={{ width: '100%', height: '100%', minHeight: '200px', background: 'hsl(var(--muted))', borderRadius: '4px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" width="48" height="48" opacity="0.5" aria-hidden="true">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
          <line x1="9" y1="3" x2="9" y2="18"/>
          <line x1="15" y1="6" x2="15" y2="21"/>
        </svg>
        <div style={{ position: 'absolute', top: '30%', left: '40%', width: '12px', height: '12px', background: 'hsl(var(--destructive))', borderRadius: '50%', border: '2px solid white' }} />
        <div style={{ position: 'absolute', top: '50%', left: '60%', width: '12px', height: '12px', background: 'hsl(var(--warning))', borderRadius: '50%', border: '2px solid white' }} />
      </div>
    </WidgetWrapper>
  );
}
