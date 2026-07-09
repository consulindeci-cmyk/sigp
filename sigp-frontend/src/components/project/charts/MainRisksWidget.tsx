import WidgetWrapper from '../../common/WidgetWrapper';
import type { ProjectTopRisk } from '@/hooks/useProjects';
import { WidgetState } from '../../../types/dashboard';

interface Props {
  data: ProjectTopRisk[];
  state?: WidgetState;
}

export default function MainRisksWidget({ data, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Risques Majeurs Actifs" state={state}>
      <div className="flex flex-col gap-2">
        {data.map(risk => (
          <div key={risk.id} className="flex items-start gap-2 text-xs">
            <span
              className={risk.niveauCriticite === 'CRITIQUE' ? 'text-destructive' : 'text-warning'}
              aria-hidden="true"
            >
              ●
            </span>
            <span className="text-foreground leading-snug">{risk.description}</span>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
