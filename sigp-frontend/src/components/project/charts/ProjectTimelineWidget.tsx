import WidgetWrapper from '../../common/WidgetWrapper';
import { WidgetState } from '../../../types/dashboard';

interface Props {
  startDate?: string;
  endDate?: string;
  state?: WidgetState;
}

const MONTHS_FR = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUI', 'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DÉC'];

function fmtMonthYear(date: Date): string {
  return `${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
}

export default function ProjectTimelineWidget({ startDate, endDate, state = 'success' }: Props) {
  const start = startDate ? new Date(startDate) : null;
  const end   = endDate   ? new Date(endDate)   : null;
  const now   = new Date();

  const pct = (start && end && end > start)
    ? Math.min(100, Math.max(0, Math.round(
        ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100,
      )))
    : 0;

  const startLabel = start ? fmtMonthYear(start) : '—';
  const endLabel   = end   ? fmtMonthYear(end)   : '—';
  const hasDates   = start !== null && end !== null;

  return (
    <WidgetWrapper title="Timeline d'Exécution Globale" state={state}>
      <div style={{ paddingTop: '20px' }}>
        {/* Date labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
            {startLabel}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
            {endLabel}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          position: 'relative',
          height: '16px',
          background: 'hsl(var(--border))',
          borderRadius: '8px',
          overflow: 'visible',
        }}>
          {hasDates && (
            <>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                background: 'hsl(var(--primary))',
                borderRadius: '8px',
                transition: 'width 0.3s ease',
              }} />
              <div style={{
                position: 'absolute',
                left: `${Math.min(Math.max(pct, 1), 99)}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '20px',
                background: 'hsl(var(--warning))',
                borderRadius: '50%',
                border: '3px solid hsl(var(--background))',
                boxShadow: '0 0 0 2px hsl(var(--warning))',
              }} />
            </>
          )}
        </div>

        {/* Status label */}
        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', fontWeight: 700 }}>
          {hasDates ? (
            <span style={{ color: 'hsl(var(--warning))' }}>
              AUJOURD'HUI — {pct}% de la durée écoulée
            </span>
          ) : (
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>
              Dates non renseignées
            </span>
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
}
