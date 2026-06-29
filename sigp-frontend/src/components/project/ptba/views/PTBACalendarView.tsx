import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { mockActivities, type Activity, type ActivityStatus } from '@/mocks/activitiesMocks';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getActivitiesForMonth(monthIndex: number, year: number): Activity[] {
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);
  return mockActivities.filter(act => {
    const start = new Date(act.dateDebut);
    const end = new Date(act.dateFin);
    return start <= monthEnd && end >= monthStart;
  });
}

function getStatusBadgeVariant(statut: ActivityStatus): 'success' | 'info' | 'destructive' | 'warning' | 'secondary' {
  switch (statut) {
    case 'Terminé': return 'success';
    case 'En cours': return 'info';
    case 'En retard': return 'destructive';
    case 'Suspendu': return 'warning';
    default: return 'secondary';
  }
}

function getStatusDotColor(statut: ActivityStatus): string {
  switch (statut) {
    case 'Terminé': return 'bg-success';
    case 'En cours': return 'bg-primary';
    case 'En retard': return 'bg-destructive';
    case 'Suspendu': return 'bg-warning';
    default: return 'bg-muted-foreground/50';
  }
}

function getProgressBarColor(statut: ActivityStatus): 'success' | 'primary' | 'destructive' | 'warning' | 'default' {
  switch (statut) {
    case 'Terminé': return 'success';
    case 'En cours': return 'primary';
    case 'En retard': return 'destructive';
    case 'Suspendu': return 'warning';
    default: return 'default';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors">
      <div className={`mt-1 shrink-0 h-2 w-2 rounded-full ${getStatusDotColor(activity.statut)}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-mono font-semibold text-muted-foreground">{activity.code}</span>
          <Badge variant={getStatusBadgeVariant(activity.statut)} className="text-[10px] px-1 py-0 shrink-0">
            {activity.avancement}%
          </Badge>
        </div>
        <p className="text-xs text-foreground font-medium leading-tight mt-0.5 line-clamp-2">
          {activity.libelle}
        </p>
        <ProgressBar
          value={activity.avancement}
          color={getProgressBarColor(activity.statut)}
          size="xs"
          className="mt-1.5"
        />
      </div>
    </div>
  );
}

function MonthCard({ monthIndex, year }: { monthIndex: number; year: number }) {
  const activities = getActivitiesForMonth(monthIndex, year);
  const visible = activities.slice(0, 3);
  const overflow = activities.length - visible.length;
  const isCurrentMonth =
    new Date().getFullYear() === year && new Date().getMonth() === monthIndex;

  return (
    <Card className={`flex flex-col ${isCurrentMonth ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground">
            {MONTH_NAMES[monthIndex]}
            {isCurrentMonth && (
              <span className="ml-2 text-[10px] font-normal text-primary">(Mois en cours)</span>
            )}
          </CardTitle>
          <Badge variant={activities.length > 0 ? 'outline' : 'secondary'} className="text-[11px]">
            {activities.length} activité{activities.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 flex-1">
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 italic">
            Aucune activité planifiée
          </p>
        ) : (
          <>
            {visible.map(act => (
              <ActivityCard key={act.id} activity={act} />
            ))}
            {overflow > 0 && (
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                +{overflow} autre{overflow > 1 ? 's' : ''} activité{overflow > 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary bar
// ─────────────────────────────────────────────────────────────────────────────

function YearSummary({ year }: { year: number }) {
  const monthly = MONTH_NAMES.map((_, i) => getActivitiesForMonth(i, year).length);
  const maxCount = Math.max(...monthly, 1);

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Vue synthétique — Densité d'activités {year}
        </p>
        <div className="flex items-end gap-1 h-12">
          {monthly.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-t-sm transition-all ${count > 0 ? 'bg-primary/70' : 'bg-muted'}`}
                style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? '4px' : '2px' }}
              />
              <span className="text-[9px] text-muted-foreground">{MONTH_SHORT[i]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PTBACalendarView
// ─────────────────────────────────────────────────────────────────────────────

interface PTBACalendarViewProps {
  annee: number;
}

export function PTBACalendarView({ annee }: PTBACalendarViewProps) {
  const [viewYear, setViewYear] = useState(annee);

  const totalForYear = mockActivities.filter(act => {
    const start = new Date(act.dateDebut);
    const end = new Date(act.dateFin);
    return start.getFullYear() <= viewYear && end.getFullYear() >= viewYear;
  }).length;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-[1400px] mx-auto p-4 flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Calendrier des Activités — {viewYear}
            </h2>
            <Badge variant="outline" className="text-xs">
              {totalForYear} activité{totalForYear !== 1 ? 's' : ''} actives
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
              onClick={() => setViewYear(y => y - 1)}
              aria-label="Année précédente"
            >
              {viewYear - 1}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewYear(annee)}
              disabled={viewYear === annee}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewYear(y => y + 1)}
              aria-label="Année suivante"
            >
              {viewYear + 1}
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* Légende */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {(['Terminé', 'En cours', 'En retard', 'Suspendu', 'Non démarré'] as ActivityStatus[]).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${getStatusDotColor(s)}`} />
              <span>{s}</span>
            </div>
          ))}
        </div>

        {/* Summary bar chart */}
        <YearSummary year={viewYear} />

        {/* 12-month grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {MONTH_NAMES.map((_, idx) => (
            <MonthCard key={idx} monthIndex={idx} year={viewYear} />
          ))}
        </div>

      </div>
    </div>
  );
}
