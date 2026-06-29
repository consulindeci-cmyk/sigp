import { mockActivities, type Activity, type ActivityStatus } from '@/mocks/activitiesMocks';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent } from '@/components/ui/data-display/Card';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';

// ─────────────────────────────────────────────────────────────────────────────
// Timeline constants — spans all mock activities
// ─────────────────────────────────────────────────────────────────────────────

const GANTT_START = new Date('2023-01-01');
const GANTT_END = new Date('2026-12-31');
const TOTAL_MS = GANTT_END.getTime() - GANTT_START.getTime();

const YEARS = [2023, 2024, 2025, 2026] as const;
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toOffset(dateStr: string): number {
  const t = Math.max(new Date(dateStr).getTime(), GANTT_START.getTime());
  return ((t - GANTT_START.getTime()) / TOTAL_MS) * 100;
}

function toWidth(startStr: string, endStr: string): number {
  const s = Math.max(new Date(startStr).getTime(), GANTT_START.getTime());
  const e = Math.min(new Date(endStr).getTime(), GANTT_END.getTime());
  return Math.max(0.5, ((e - s) / TOTAL_MS) * 100);
}

function getBarColor(statut: ActivityStatus): string {
  switch (statut) {
    case 'Terminé': return 'bg-success';
    case 'En cours': return 'bg-primary';
    case 'En retard': return 'bg-destructive';
    case 'Suspendu': return 'bg-warning';
    default: return 'bg-muted-foreground/40';
  }
}

function getProgressColor(statut: ActivityStatus): 'success' | 'primary' | 'destructive' | 'warning' | 'default' {
  switch (statut) {
    case 'Terminé': return 'success';
    case 'En cours': return 'primary';
    case 'En retard': return 'destructive';
    case 'Suspendu': return 'warning';
    default: return 'default';
  }
}

function getBadgeVariant(statut: ActivityStatus): 'success' | 'info' | 'destructive' | 'warning' | 'secondary' {
  switch (statut) {
    case 'Terminé': return 'success';
    case 'En cours': return 'info';
    case 'En retard': return 'destructive';
    case 'Suspendu': return 'warning';
    default: return 'secondary';
  }
}

function getPriorityDot(priorite: Activity['priorite']): string {
  switch (priorite) {
    case 'Critique': return 'bg-destructive';
    case 'Haute': return 'bg-warning';
    case 'Moyenne': return 'bg-primary';
    default: return 'bg-muted-foreground';
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

// Today marker position
const todayOffset = Math.min(100, Math.max(0, toOffset(new Date().toISOString().split('T')[0])));

// ─────────────────────────────────────────────────────────────────────────────
// Legend
// ─────────────────────────────────────────────────────────────────────────────

function GanttLegend() {
  const items: { statut: ActivityStatus; label: string }[] = [
    { statut: 'Terminé', label: 'Terminé' },
    { statut: 'En cours', label: 'En cours' },
    { statut: 'En retard', label: 'En retard' },
    { statut: 'Suspendu', label: 'Suspendu' },
    { statut: 'Non démarré', label: 'Non démarré' },
  ];
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {items.map(({ statut, label }) => (
        <div key={statut} className="flex items-center gap-1.5">
          <div className={`h-3 w-5 rounded-sm ${getBarColor(statut)}`} />
          <span>{label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-0.5 bg-destructive/70" />
        <span>Aujourd'hui</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gantt bar row
// ─────────────────────────────────────────────────────────────────────────────

function GanttRow({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const left = toOffset(activity.dateDebut);
  const width = toWidth(activity.dateDebut, activity.dateFin);
  const progressWidth = width * (activity.avancement / 100);

  return (
    <tr className={`hover:bg-muted/20 transition-colors ${!isLast ? 'border-b border-border' : ''}`}>

      {/* Left info panel — sticky */}
      <td className="w-72 shrink-0 px-3 py-2.5 sticky left-0 z-[1] bg-card border-r border-border">
        <div className="flex items-start gap-2">
          <div className={`mt-1 shrink-0 h-2 w-2 rounded-full ${getPriorityDot(activity.priorite)}`}
            title={`Priorité: ${activity.priorite}`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono font-semibold text-muted-foreground">{activity.code}</span>
              <Badge variant={getBadgeVariant(activity.statut)} className="text-[10px] px-1 py-0">
                {activity.statut}
              </Badge>
            </div>
            <p className="text-xs font-medium text-foreground leading-tight mt-0.5 truncate" title={activity.libelle}>
              {activity.libelle}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{activity.composante.split('—')[0].trim()}</p>
          </div>
        </div>
      </td>

      {/* Progress column */}
      <td className="w-28 px-3 py-2.5 border-r border-border">
        <ProgressBar
          value={activity.avancement}
          color={getProgressColor(activity.statut)}
          size="xs"
          showLabel
          aria-label={`Avancement: ${activity.avancement}%`}
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDate(activity.dateDebut)} → {formatDate(activity.dateFin)}
        </p>
      </td>

      {/* Timeline bar */}
      <td className="px-2 py-2.5 relative min-w-[600px]">
        {/* Today line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-destructive/60 z-10 pointer-events-none"
          style={{ left: `${todayOffset}%` }}
        />

        {/* Quarter grid lines */}
        {[25, 50, 75].map(pct => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 w-px bg-border/50 pointer-events-none"
            style={{ left: `${pct}%` }}
          />
        ))}

        {/* Bar background (total duration) */}
        <div
          className={`absolute top-[30%] h-[40%] rounded-sm opacity-30 ${getBarColor(activity.statut)}`}
          style={{ left: `${left}%`, width: `${width}%` }}
        />

        {/* Bar filled (progress) */}
        <div
          className={`absolute top-[30%] h-[40%] rounded-sm ${getBarColor(activity.statut)}`}
          style={{ left: `${left}%`, width: `${progressWidth}%`, minWidth: activity.avancement > 0 ? '3px' : '0' }}
        />

        {/* Percentage label inside bar */}
        {width > 8 && (
          <div
            className="absolute top-[30%] h-[40%] flex items-center pl-1.5 pointer-events-none"
            style={{ left: `${left}%`, width: `${width}%` }}
          >
            <span className="text-[10px] font-semibold text-white drop-shadow-sm">
              {activity.avancement}%
            </span>
          </div>
        )}
      </td>

    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PTBAGanttView
// ─────────────────────────────────────────────────────────────────────────────

interface PTBAGanttViewProps {
  annee?: number;
}

export function PTBAGanttView({ annee: _annee }: PTBAGanttViewProps) {
  const total = mockActivities.length;
  const inProgress = mockActivities.filter(a => a.statut === 'En cours').length;
  const done = mockActivities.filter(a => a.statut === 'Terminé').length;
  const late = mockActivities.filter(a => a.statut === 'En retard').length;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="min-w-[900px] p-4 flex flex-col gap-4">

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Total activités</p>
              <p className="text-xl font-bold font-mono text-foreground mt-1">{total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">En cours</p>
              <p className="text-xl font-bold font-mono text-primary mt-1">{inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Terminées</p>
              <p className="text-xl font-bold font-mono text-success mt-1">{done}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">En retard</p>
              <p className="text-xl font-bold font-mono text-destructive mt-1">{late}</p>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <GanttLegend />

        {/* Gantt chart */}
        <Card className="overflow-hidden">
          <CardContent className="p-0 overflow-auto">
            <table className="border-collapse w-full text-left">

              <thead className="sticky top-0 z-10">

                {/* Year header */}
                <tr className="bg-primary text-primary-foreground">
                  <th className="w-72 shrink-0 px-4 py-2 text-xs font-semibold sticky left-0 z-[12] bg-primary border-r border-primary-foreground/20">
                    Activité
                  </th>
                  <th className="w-28 px-3 py-2 text-xs font-semibold border-r border-primary-foreground/20">
                    Avancement
                  </th>
                  <th className="px-2 py-2 text-xs font-semibold">
                    <div className="flex min-w-[600px]">
                      {YEARS.map((year, yi) => (
                        <div
                          key={year}
                          className="flex-1 text-center border-l border-primary-foreground/20"
                          style={{ width: '25%' }}
                        >
                          {year}
                          {yi === 0 && <span className="sr-only"> (début de la période)</span>}
                        </div>
                      ))}
                    </div>
                  </th>
                </tr>

                {/* Quarter header */}
                <tr className="bg-primary/80 text-primary-foreground">
                  <th className="w-72 px-4 py-1.5 text-[11px] sticky left-0 z-[12] bg-primary/80 border-r border-primary-foreground/20">
                    Code — Libellé
                  </th>
                  <th className="w-28 px-3 py-1.5 text-[11px] border-r border-primary-foreground/20">
                    Dates
                  </th>
                  <th className="px-2 py-1.5 text-[11px]">
                    <div className="flex min-w-[600px]">
                      {YEARS.map(year =>
                        QUARTERS.map(q => (
                          <div
                            key={`${year}-${q}`}
                            className="flex-1 text-center border-l border-primary-foreground/20"
                            style={{ width: '6.25%' }}
                          >
                            {q}
                          </div>
                        ))
                      )}
                    </div>
                  </th>
                </tr>

              </thead>

              <tbody>
                {mockActivities.map((act, i) => (
                  <GanttRow
                    key={act.id}
                    activity={act}
                    isLast={i === mockActivities.length - 1}
                  />
                ))}
              </tbody>

            </table>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-[11px] text-muted-foreground text-center pb-2">
          Données mock · La ligne rouge verticale marque la date d'aujourd'hui ·
          Les barres pleines représentent la progression réelle
        </p>

      </div>
    </div>
  );
}
