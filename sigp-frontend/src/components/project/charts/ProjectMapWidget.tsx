import WidgetWrapper from '../../common/WidgetWrapper';
import { WidgetState } from '../../../types/dashboard';

interface Props {
  country?: string;
  state?: WidgetState;
}

export default function ProjectMapWidget({ country, state = 'success' }: Props) {
  return (
    <WidgetWrapper title="Localisation Géographique" state={state}>
      <div style={{
        width: '100%',
        height: '100%',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          width="40"
          height="40"
          aria-hidden="true"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" fill="hsl(var(--primary))" stroke="none" />
        </svg>

        {country ? (
          <span style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'hsl(var(--foreground))',
            textAlign: 'center',
          }}>
            {country}
          </span>
        ) : (
          <span style={{
            fontSize: '12px',
            color: 'hsl(var(--muted-foreground))',
            textAlign: 'center',
          }}>
            Pays non renseigné
          </span>
        )}
      </div>
    </WidgetWrapper>
  );
}
