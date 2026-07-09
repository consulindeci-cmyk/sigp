import WidgetWrapper from '../../common/WidgetWrapper';
import type { CriticalActivityResponse } from '@/hooks/useProjects';
import { WidgetState } from '../../../types/dashboard';

interface Props {
  data: CriticalActivityResponse[];
  state?: WidgetState;
}

export default function CriticalActivitiesWidget({ data, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Activités Critiques (Retards)" state={state}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map(act => (
          <div key={act.id} style={{
            fontSize: '11px', padding: '8px', borderRadius: '4px', fontWeight: 600,
            background: act.joursRetard > 30 ? 'var(--red-bg)' : 'var(--amber-bg)',
            color: act.joursRetard > 30 ? 'var(--red)' : 'var(--amber)',
          }}>
            {act.code} - {act.nom} (Retard {act.joursRetard}j)
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
