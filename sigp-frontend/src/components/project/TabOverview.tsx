import React, { Suspense } from 'react';
import { Loader2, Info, AlertTriangle, CheckCircle } from 'lucide-react';

import type { ProjectEvent } from '@/types/dashboard';
import type { HistoriqueProjet } from '@/types';

import { formatBudget, type Project } from '@/lib/projectAdapter';
import {
  useProjectTopRisks,
  useProjectCriticalActivities,
  useProjectDisbursements,
  useProjectBudgetDistribution,
  useProjectFundingSources,
  useProjectMilestones,
} from '@/hooks/useProjects';
import { useHistory } from '@/hooks/useHistory';

const EVMSummaryCard            = React.lazy(() => import('./EVMSummaryCard'));
const EvmChart                = React.lazy(() => import('./charts/EvmChart'));
const DisbursementChart       = React.lazy(() => import('./charts/DisbursementChart'));
const BudgetDistributionChart = React.lazy(() => import('./charts/BudgetDistributionChart'));
const FundingChart            = React.lazy(() => import('./charts/FundingChart'));
const ProgressComparisonChart = React.lazy(() => import('./charts/ProgressComparisonChart'));
const BudgetConsumptionWidget = React.lazy(() => import('./charts/BudgetConsumptionWidget'));
const CriticalActivitiesWidget = React.lazy(() => import('./charts/CriticalActivitiesWidget'));
const MainRisksWidget         = React.lazy(() => import('./charts/MainRisksWidget'));
const MilestoneCalendarWidget = React.lazy(() => import('./charts/MilestoneCalendarWidget'));
const ProjectTimelineWidget   = React.lazy(() => import('./charts/ProjectTimelineWidget'));
const ProjectMapWidget        = React.lazy(() => import('./charts/ProjectMapWidget'));
const MonthlyBudgetWidget     = React.lazy(() => import('./charts/MonthlyBudgetWidget'));
const ValidationHistoryWidget = React.lazy(() => import('./charts/ValidationHistoryWidget'));
const EventChronologyWidget   = React.lazy(() => import('./charts/EventChronologyWidget'));

const WidgetSkeleton = () => (
  <div
    className="flex items-center justify-center bg-muted/5 border border-border rounded-lg"
    style={{ minHeight: '150px' }}
  >
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectSummary {
  budgetTotal: number;
  montantEngage: number;
  montantPaye: number;
  soldeDisponible: number;
  tauxDecaissement: number;
  nombreActivites: number;
  activitesTerminees: number;
  activitesEnCours: number;
  activitesEnRetard: number;
  nombreContrats: number;
  contratsActifs: number;
  nombreRisques: number;
  risquesCritiques: number;
  tauxAvancementGlobal: number;
  progressScore: number;
  profileScore: number;
}

interface KpiItem {
  label: string;
  val: string;
  colorClass: string;
  target: string;
}

interface AlertItem {
  variant: 'warning' | 'destructive';
  title: string;
  message: string;
  target: string;
}

interface TabOverviewProps {
  setActiveTab: (tab: string) => void;
  project?: Project;
  summary?: ProjectSummary;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d?: string): string {
  if (!d) return '—';
  const parts = d.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return d;
  const [y, m, day] = parts;
  return `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

// Journal des Validations / Chronologie des Événements affichaient jusqu'ici
// des événements d'autres projets (mockEvents, données figées non liées au
// projet consulté) — dérivé ici de l'historique réel (table `historique`,
// même source que l'onglet Historique).
function toProjectEvent(h: HistoriqueProjet): ProjectEvent {
  const type: ProjectEvent['type'] =
    h.action === 'VALIDATION' ? 'validation'
    : h.niveau === 'CRITIQUE' || h.action === 'SUPPRESSION' || h.action === 'REJET' ? 'alert'
    : h.module === 'Décaissements' ? 'payment'
    : 'milestone';
  return {
    id: h.id,
    date: `${fmtDate(h.date)} ${h.heure.slice(0, 5)}`,
    type,
    description: `${h.element} — ${h.description}`,
  };
}

function buildKpis(project?: Project, summary?: ProjectSummary): KpiItem[] {
  const devise = project?.devise ?? 'XOF';
  const fmt = (n: number) => formatBudget(n, devise);
  const pct = (n: number) => `${n}%`;
  const num = (n: number) => String(n);

  if (!summary) {
    return [
      { label: 'BAC',        val: '—', colorClass: 'text-foreground',       target: 'budget'        },
      { label: 'Engagé',     val: '—', colorClass: 'text-foreground',       target: 'budget'        },
      { label: 'Décaissé',   val: '—', colorClass: 'text-success',          target: 'disbursements' },
      { label: 'Restant',    val: '—', colorClass: 'text-muted-foreground', target: 'budget'        },
      { label: 'Physique',   val: '—', colorClass: 'text-primary',          target: 'evm'           },
      { label: 'Financière', val: '—', colorClass: 'text-success',          target: 'disbursements' },
      { label: 'Complétude', val: '—', colorClass: 'text-warning',          target: 'overview'      },
      { label: 'Activités',  val: '—', colorClass: 'text-foreground',       target: 'ptba'          },
      { label: 'Risques',    val: '—', colorClass: 'text-destructive',      target: 'risks'         },
      { label: 'Alertes',    val: '—', colorClass: 'text-destructive',      target: 'risks'         },
    ];
  }

  return [
    { label: 'BAC',        val: fmt(summary.budgetTotal),          colorClass: 'text-foreground',       target: 'budget'        },
    { label: 'Engagé',     val: fmt(summary.montantEngage),        colorClass: 'text-foreground',       target: 'budget'        },
    { label: 'Décaissé',   val: fmt(summary.montantPaye),          colorClass: 'text-success',          target: 'disbursements' },
    { label: 'Restant',    val: fmt(summary.soldeDisponible),      colorClass: 'text-muted-foreground', target: 'budget'        },
    { label: 'Physique',   val: pct(summary.tauxAvancementGlobal), colorClass: 'text-primary',          target: 'evm'           },
    { label: 'Financière', val: pct(summary.tauxDecaissement),     colorClass: 'text-success',          target: 'disbursements' },
    { label: 'Complétude', val: pct(summary.profileScore),         colorClass: 'text-warning',          target: 'overview'      },
    { label: 'Activités',  val: num(summary.nombreActivites),      colorClass: 'text-foreground',       target: 'ptba'          },
    { label: 'Risques',    val: num(summary.nombreRisques),        colorClass: 'text-destructive',      target: 'risks'         },
    { label: 'Alertes',    val: num(summary.risquesCritiques),     colorClass: 'text-destructive',      target: 'risks'         },
  ];
}

function buildAlerts(summary?: ProjectSummary): AlertItem[] {
  if (!summary) return [];
  const alerts: AlertItem[] = [];

  if (summary.activitesEnRetard > 0) {
    const n = summary.activitesEnRetard;
    alerts.push({
      variant: 'warning',
      title: 'Activités en retard',
      message: `${n} activité${n > 1 ? 's' : ''} en retard nécessite${n > 1 ? 'nt' : ''} une attention.`,
      target: 'ptba',
    });
  }

  if (summary.risquesCritiques > 0) {
    const n = summary.risquesCritiques;
    alerts.push({
      variant: 'destructive',
      title: 'Risques critiques',
      message: `${n} risque${n > 1 ? 's' : ''} critique${n > 1 ? 's' : ''} ${n > 1 ? 'sont' : 'est'} actuellement ouvert${n > 1 ? 's' : ''}.`,
      target: 'risks',
    });
  }

  return alerts;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TabOverview({ setActiveTab, project, summary }: TabOverviewProps) {
  const kpis   = buildKpis(project, summary);
  const alerts = buildAlerts(summary);

  const projectId = project?.id ?? '';
  const { data: topRisks = [], isLoading: risksLoading, isError: risksError } = useProjectTopRisks(projectId);
  const { data: criticalActivities = [], isLoading: activitiesLoading, isError: activitiesError } = useProjectCriticalActivities(projectId);

  const { data: disbursementsRaw = [], isLoading: disbLoading, isError: disbError } = useProjectDisbursements(projectId);
  const { data: budgetDistRaw = [], isLoading: budgetDistLoading, isError: budgetDistError } = useProjectBudgetDistribution(projectId);
  const { data: fundingSourcesRaw = [], isLoading: fundingLoading, isError: fundingError } = useProjectFundingSources(projectId);
  const { data: milestonesRaw = [], isLoading: milestonesLoading, isError: milestonesError } = useProjectMilestones(projectId);

  const { data: historyPage, isLoading: historyLoading, isError: historyError } = useHistory(projectId);
  const historyEvents = (historyPage?.data ?? []).map(toProjectEvent);

  const BUDGET_COLORS = ['var(--navy-500)', 'var(--green)', 'var(--amber)', 'hsl(var(--primary))', 'var(--slate)'];
  const FUNDING_COLORS = ['var(--navy-700)', 'var(--slate)', 'var(--amber)', 'var(--green)'];

  const disbursementPoints = disbursementsRaw.map((d) => ({ label: d.month, value: d.montantPaye }));

  const budgetTotal = budgetDistRaw.reduce((sum, r) => sum + r.montant, 0);
  const budgetDistPoints = budgetDistRaw.map((r, i) => ({
    label: r.rubrique,
    value: r.montant,
    percentage: budgetTotal > 0 ? Math.round((r.montant / budgetTotal) * 100) : 0,
    color: BUDGET_COLORS[i % BUDGET_COLORS.length],
  }));

  const fundingPoints = fundingSourcesRaw.map((s, i) => ({
    label: s.source,
    value: s.montant,
    percentage: s.pourcentage,
    color: FUNDING_COLORS[i % FUNDING_COLORS.length],
  }));

  const milestones = milestonesRaw
    .filter((m) => m.datePrevue !== null)
    .map((m) => ({
      id: m.id,
      date: m.datePrevue as string,
      title: m.titre,
      status: (
        m.statut === 'VALIDE' ? 'achieved' : m.statut === 'EN_RETARD' ? 'delayed' : 'pending'
      ) as 'pending' | 'achieved' | 'delayed',
    }));

  const idItems = [
    { k: 'Code',       v: project?.code        || '—' },
    { k: 'Nom',        v: project?.name        || '—' },
    { k: 'Manager',    v: project?.manager     || '—' },
    { k: 'Secteur',    v: project?.sector      || '—' },
    { k: 'Pays',       v: project?.country     || '—' },
    { k: 'Bailleur',   v: project?.donor       || '—' },
    { k: 'Début',      v: fmtDate(project?.startDate) },
    { k: 'Fin prévue', v: fmtDate(project?.endDate)   },
    { k: 'Statut',     v: project?.status      || '—' },
    { k: 'Devise',     v: project?.devise      || '—' },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── BLOC 1 : RUBAN KPI ─────────────────────────────────────────────── */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 100px), 1fr))' }}
      >
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => setActiveTab(kpi.target)}
            className="bg-card border border-border rounded-md p-3 text-center transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="text-[10px] text-muted-foreground uppercase mb-1 font-semibold">
              {kpi.label}
            </div>
            <div className={`text-[15px] font-bold ${kpi.colorClass}`}>{kpi.val}</div>
          </button>
        ))}
      </div>

      {/* ── BLOC 2 & 3 : INFOS RAPIDES & ALERTES ──────────────────────────── */}
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}
      >
        {/* Carte d'Identité */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Carte d'Identité
          </h3>
          <div className="flex flex-col gap-3">
            {idItems.map((i) => (
              <div key={i.k} className="flex justify-between text-sm border-b border-border pb-1 gap-2">
                <span className="text-muted-foreground shrink-0">{i.k}</span>
                <span
                  className="font-semibold text-foreground text-right truncate"
                  title={i.v}
                >
                  {i.v}
                </span>
              </div>
            ))}
            {project?.description?.trim() && (
              <div className="pt-1">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">
                  Description
                </span>
                <p className="text-sm text-foreground mt-1 leading-relaxed line-clamp-4">
                  {project.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Centre d'Alertes */}
        <div
          className="bg-card border border-border rounded-lg p-5"
          style={{ gridColumn: 'auto / span 2' }}
        >
          <h3 className="text-sm font-semibold text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Centre d'Alertes Actives
          </h3>

          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-success p-3 bg-success/5 border border-success/20 rounded-md">
              <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Aucune alerte active.</span>
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}
            >
              {alerts.map((alert, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(alert.target)}
                  className={[
                    'text-left p-3 rounded-md border-l-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors',
                    alert.variant === 'destructive'
                      ? 'bg-destructive/5 border border-destructive/20 border-l-destructive hover:bg-destructive/10'
                      : 'bg-warning/5 border border-warning/20 border-l-warning hover:bg-warning/10',
                  ].join(' ')}
                >
                  <div
                    className={`text-xs font-bold ${
                      alert.variant === 'destructive' ? 'text-destructive' : 'text-warning'
                    }`}
                  >
                    {alert.title}
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      alert.variant === 'destructive' ? 'text-destructive/80' : 'text-warning/80'
                    }`}
                  >
                    {alert.message}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── BLOC 4 : MUR DE PERFORMANCE ────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-4 pb-3 border-b border-border flex items-center gap-2">
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" width="18" height="18" aria-hidden="true"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Performance &amp; Suivi Analytique
        </h3>

        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}
        >
          {/* Courbe S + Décaissements — pleine largeur */}
          <div
            className="col-span-full grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))' }}
          >
            {/* ✅ Données réelles : useProjectEvmSummary/useProjectEvmHistory */}
            <Suspense fallback={<WidgetSkeleton />}>
              <EVMSummaryCard projectId={project?.id ?? ''} />
            </Suspense>
            <Suspense fallback={<WidgetSkeleton />}>
              <EvmChart projectId={project?.id ?? ''} />
            </Suspense>
            {/* Décaissements mensuels */}
            <Suspense fallback={<WidgetSkeleton />}>
              <DisbursementChart
                data={disbursementPoints}
                state={disbLoading ? 'loading' : disbError ? 'error' : disbursementPoints.length === 0 ? 'empty' : 'success'}
              />
            </Suspense>
          </div>

          {/* Budget par composante */}
          <Suspense fallback={<WidgetSkeleton />}>
            <BudgetDistributionChart
              data={budgetDistPoints}
              state={budgetDistLoading ? 'loading' : budgetDistError ? 'error' : budgetDistPoints.length === 0 ? 'empty' : 'success'}
            />
          </Suspense>

          {/* Sources de financement */}
          <Suspense fallback={<WidgetSkeleton />}>
            <FundingChart
              data={fundingPoints}
              state={fundingLoading ? 'loading' : fundingError ? 'error' : fundingPoints.length === 0 ? 'empty' : 'success'}
            />
          </Suspense>

          {/* ✅ Données réelles : tauxAvancementGlobal + tauxDecaissement */}
          <Suspense fallback={<WidgetSkeleton />}>
            <ProgressComparisonChart
              physical={summary?.tauxAvancementGlobal ?? 0}
              financial={summary?.tauxDecaissement ?? 0}
            />
          </Suspense>

          {/* ✅ Données réelles : montantPaye + budgetTotal + devise */}
          <Suspense fallback={<WidgetSkeleton />}>
            <BudgetConsumptionWidget
              consumed={summary?.montantPaye ?? 0}
              total={summary?.budgetTotal ?? 0}
              currency={project?.devise ?? 'XOF'}
            />
          </Suspense>

          <Suspense fallback={<WidgetSkeleton />}>
            <CriticalActivitiesWidget
              data={criticalActivities}
              state={activitiesLoading ? 'loading' : activitiesError ? 'error' : criticalActivities.length === 0 ? 'empty' : 'success'}
            />
          </Suspense>

          <Suspense fallback={<WidgetSkeleton />}>
            <MainRisksWidget
              data={topRisks}
              state={risksLoading ? 'loading' : risksError ? 'error' : topRisks.length === 0 ? 'empty' : 'success'}
            />
          </Suspense>

          {/* Jalons */}
          <Suspense fallback={<WidgetSkeleton />}>
            <MilestoneCalendarWidget
              data={milestones}
              state={milestonesLoading ? 'loading' : milestonesError ? 'error' : milestones.length === 0 ? 'empty' : 'success'}
            />
          </Suspense>

          {/* ✅ Données réelles : pays du projet */}
          <Suspense fallback={<WidgetSkeleton />}>
            <ProjectMapWidget country={project?.country} />
          </Suspense>

          {/* Budget mensuel + historique + chronologie */}
          <div
            className="col-span-full grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}
          >
            {/* Décaissements mensuels */}
            <Suspense fallback={<WidgetSkeleton />}>
              <MonthlyBudgetWidget
                data={disbursementPoints}
                state={disbLoading ? 'loading' : disbError ? 'error' : disbursementPoints.length === 0 ? 'empty' : 'success'}
              />
            </Suspense>
            {/* ✅ Données réelles : historique du projet (table `historique`) */}
            <Suspense fallback={<WidgetSkeleton />}>
              <ValidationHistoryWidget
                data={historyEvents}
                state={historyLoading ? 'loading' : historyError ? 'error' : historyEvents.length === 0 ? 'empty' : 'success'}
              />
            </Suspense>
            <Suspense fallback={<WidgetSkeleton />}>
              <EventChronologyWidget
                data={historyEvents}
                state={historyLoading ? 'loading' : historyError ? 'error' : historyEvents.length === 0 ? 'empty' : 'success'}
              />
            </Suspense>
          </div>

          {/* ✅ Données réelles : dateDebut + dateFinPrevue */}
          <div className="col-span-full">
            <Suspense fallback={<WidgetSkeleton />}>
              <ProjectTimelineWidget
                startDate={project?.startDate}
                endDate={project?.endDate}
              />
            </Suspense>
          </div>
        </div>
      </div>

    </div>
  );
}
