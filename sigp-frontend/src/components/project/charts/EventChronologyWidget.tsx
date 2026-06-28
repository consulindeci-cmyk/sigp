import WidgetWrapper from '../../common/WidgetWrapper';
import { ProjectEvent, WidgetState } from '../../../types/dashboard';

interface Props {
  data: ProjectEvent[];
  state?: WidgetState;
}

export default function EventChronologyWidget({ data, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Chronologie des Événements" state={state}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map(evt => (
          <div key={evt.id} style={{ fontSize: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: evt.type === 'alert' ? 'var(--red)' : 'var(--navy-700)', textTransform: 'capitalize' }}>{evt.type}</span>
              <span style={{ color: 'var(--slate)', fontSize: '11px' }}>{evt.date}</span>
            </div>
            <div style={{ color: 'var(--ink)' }}>{evt.description}</div>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
