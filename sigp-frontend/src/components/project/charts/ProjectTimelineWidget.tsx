import WidgetWrapper from '../../common/WidgetWrapper';
import { WidgetState } from '../../../types/dashboard';

interface Props {
  state?: WidgetState;
}

export default function ProjectTimelineWidget({ state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Timeline d'Exécution Globale" state={state}>
      <div style={{ position: 'relative', height: '40px', background: 'hsl(var(--border))', borderRadius: '20px', display: 'flex', alignItems: 'center', padding: '0 10px', marginTop: '10px' }}>
        <div style={{ position: 'absolute', left: '15px', fontSize: '11px', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>JAN 2023</div>
        <div style={{ position: 'absolute', right: '15px', fontSize: '11px', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>DÉC 2026</div>
        <div style={{ width: '65%', height: '8px', background: 'hsl(var(--primary))', borderRadius: '4px', marginLeft: '60px' }} />
        <div style={{ position: 'absolute', left: '65%', width: '12px', height: '12px', background: 'hsl(var(--warning))', borderRadius: '50%', border: '2px solid white', transform: 'translateX(-50%)' }} />
        <div style={{ position: 'absolute', left: '65%', top: '-20px', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--warning))', transform: 'translateX(-50%)' }}>AUJOURD'HUI</div>
      </div>
    </WidgetWrapper>
  );
}
