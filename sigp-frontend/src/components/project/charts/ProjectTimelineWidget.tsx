import WidgetWrapper from '../../common/WidgetWrapper';
import { WidgetState } from '../../../types/dashboard';

interface Props {
  state?: WidgetState;
}

export default function ProjectTimelineWidget({ state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Timeline d'Exécution Globale" state={state}>
      <div style={{ position: 'relative', height: '40px', background: 'var(--line-soft)', borderRadius: '20px', display: 'flex', alignItems: 'center', padding: '0 10px', marginTop: '10px' }}>
        <div style={{ position: 'absolute', left: '15px', fontSize: '11px', fontWeight: 600, color: 'var(--slate)' }}>JAN 2023</div>
        <div style={{ position: 'absolute', right: '15px', fontSize: '11px', fontWeight: 600, color: 'var(--slate)' }}>DÉC 2026</div>
        <div style={{ width: '65%', height: '8px', background: 'var(--navy-500)', borderRadius: '4px', marginLeft: '60px' }}></div>
        <div style={{ position: 'absolute', left: '65%', width: '12px', height: '12px', background: 'var(--amber)', borderRadius: '50%', border: '2px solid white', transform: 'translateX(-50%)' }}></div>
        <div style={{ position: 'absolute', left: '65%', top: '-20px', fontSize: '11px', fontWeight: 700, color: 'var(--amber)', transform: 'translateX(-50%)' }}>AUJOURD'HUI</div>
      </div>
    </WidgetWrapper>
  );
}
