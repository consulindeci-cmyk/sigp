import React, { Suspense } from 'react';
import { Loader2, Info, AlertTriangle } from 'lucide-react';

import {
  mockEvmData, mockDisbursements, mockBudgetDistribution,
  mockFundingDistribution, mockCriticalActivities, mockMainRisks,
  mockMilestones, mockEvents
} from '../../mocks/dashboardMocks';

const EvmChart = React.lazy(() => import('./charts/EvmChart'));
const DisbursementChart = React.lazy(() => import('./charts/DisbursementChart'));
const BudgetDistributionChart = React.lazy(() => import('./charts/BudgetDistributionChart'));
const FundingChart = React.lazy(() => import('./charts/FundingChart'));
const ProgressComparisonChart = React.lazy(() => import('./charts/ProgressComparisonChart'));
const BudgetConsumptionWidget = React.lazy(() => import('./charts/BudgetConsumptionWidget'));
const CriticalActivitiesWidget = React.lazy(() => import('./charts/CriticalActivitiesWidget'));
const MainRisksWidget = React.lazy(() => import('./charts/MainRisksWidget'));
const MilestoneCalendarWidget = React.lazy(() => import('./charts/MilestoneCalendarWidget'));
const ProjectTimelineWidget = React.lazy(() => import('./charts/ProjectTimelineWidget'));
const ProjectMapWidget = React.lazy(() => import('./charts/ProjectMapWidget'));
const MonthlyBudgetWidget = React.lazy(() => import('./charts/MonthlyBudgetWidget'));
const ValidationHistoryWidget = React.lazy(() => import('./charts/ValidationHistoryWidget'));
const EventChronologyWidget = React.lazy(() => import('./charts/EventChronologyWidget'));

const WidgetSkeleton = () => (
  <div className="flex items-center justify-center bg-muted/5 border border-border rounded-lg" style={{ minHeight: '150px' }}>
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
);

interface TabOverviewProps {
  setActiveTab: (tab: string) => void;
}

const KPI_ITEMS = [
  { label: 'BAC',        val: '$24.6M', colorClass: 'text-foreground',    target: 'budget' },
  { label: 'Engagé',    val: '$18.2M', colorClass: 'text-foreground',    target: 'procurement' },
  { label: 'Décaissé',  val: '$16.9M', colorClass: 'text-success',       target: 'disbursements' },
  { label: 'Restant',   val: '$7.7M',  colorClass: 'text-muted-foreground', target: 'budget' },
  { label: 'Physique',  val: '76%',    colorClass: 'text-destructive',   target: 'evm' },
  { label: 'Financière',val: '68.7%',  colorClass: 'text-success',       target: 'disbursements' },
  { label: 'Complétude',val: '35%',    colorClass: 'text-warning',       target: 'overview' },
  { label: 'Activités', val: '124',    colorClass: 'text-foreground',    target: 'activities' },
  { label: 'Livrables', val: '45',     colorClass: 'text-foreground',    target: 'deliverables' },
  { label: 'Risques',   val: '3',      colorClass: 'text-destructive',   target: 'risks' },
  { label: 'Alertes',   val: '2',      colorClass: 'text-destructive',   target: 'risks' },
] as const;

const ID_ITEMS = [
  { k: "Sponsor",      v: "Ministère de l'Énergie" },
  { k: "Zone",         v: "Niger, Diffa & Zinder" },
  { k: "Statut",       v: "En Exécution" },
  { k: "Devise",       v: "USD ($)" },
  { k: "Méthode EVM",  v: "0/100 (Livraison stricte)" },
];

export default function TabOverview({ setActiveTab }: TabOverviewProps) {
  return (
    <div className="flex flex-col gap-6">

      {/* BLOC 1 : RUBAN KPI */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
        {KPI_ITEMS.map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => setActiveTab(kpi.target)}
            className="bg-card border border-border rounded-md p-3 text-center transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="text-[10px] text-muted-foreground uppercase mb-1 font-semibold">{kpi.label}</div>
            <div className={`text-[15px] font-bold ${kpi.colorClass}`}>{kpi.val}</div>
          </button>
        ))}
      </div>

      {/* BLOC 2 & 3 : INFOS RAPIDES & ALERTES */}
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

        {/* Carte d'Identité */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Carte d'Identité
          </h3>
          <div className="flex flex-col gap-3">
            {ID_ITEMS.map(i => (
              <div key={i.k} className="flex justify-between text-sm border-b border-border pb-1">
                <span className="text-muted-foreground">{i.k}</span>
                <span className="font-semibold text-foreground">{i.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Centre d'Alertes */}
        <div className="bg-card border border-border rounded-lg p-5" style={{ gridColumn: 'auto / span 2' }}>
          <h3 className="text-sm font-semibold text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Centre d'Alertes Actives
          </h3>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <button
              onClick={() => setActiveTab('evm')}
              className="text-left p-3 bg-destructive/5 border border-destructive/20 rounded-md border-l-4 border-l-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-destructive/10 transition-colors"
            >
              <div className="text-xs font-bold text-destructive">Dépassement (SPI)</div>
              <div className="text-[11px] text-destructive/80 mt-0.5">Indice de coût (0.79) critique.</div>
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className="text-left p-3 bg-warning/5 border border-warning/20 rounded-md border-l-4 border-l-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-warning/10 transition-colors"
            >
              <div className="text-xs font-bold text-warning">Activités en retard</div>
              <div className="text-[11px] text-warning/80 mt-0.5">14 activités bloquées.</div>
            </button>
            <button
              onClick={() => setActiveTab('risks')}
              className="text-left p-3 bg-destructive/5 border border-destructive/20 rounded-md border-l-4 border-l-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-destructive/10 transition-colors"
            >
              <div className="text-xs font-bold text-destructive">Risques Majeurs</div>
              <div className="text-[11px] text-destructive/80 mt-0.5">3 risques à probabilité &gt; 80%.</div>
            </button>
            <button
              onClick={() => setActiveTab('deliverables')}
              className="text-left p-3 bg-warning/5 border border-warning/20 rounded-md border-l-4 border-l-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-warning/10 transition-colors"
            >
              <div className="text-xs font-bold text-warning">Livrables échus</div>
              <div className="text-[11px] text-warning/80 mt-0.5">2 rapports non soumis.</div>
            </button>
          </div>
        </div>

      </div>

      {/* BLOC 4 : MUR DE PERFORMANCE */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-4 pb-3 border-b border-border flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Performance &amp; Suivi Analytique
        </h3>

        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

          <div className="col-span-full grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
            <Suspense fallback={<WidgetSkeleton />}><EvmChart data={mockEvmData} /></Suspense>
            <Suspense fallback={<WidgetSkeleton />}><DisbursementChart data={mockDisbursements} /></Suspense>
          </div>

          <Suspense fallback={<WidgetSkeleton />}><BudgetDistributionChart data={mockBudgetDistribution} /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><FundingChart data={mockFundingDistribution} /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><ProgressComparisonChart physical={76} financial={68.7} /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><BudgetConsumptionWidget consumed={16900000} total={24600000} currency="$" /></Suspense>

          <Suspense fallback={<WidgetSkeleton />}><CriticalActivitiesWidget data={mockCriticalActivities} /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><MainRisksWidget data={mockMainRisks} /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><MilestoneCalendarWidget data={mockMilestones} /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><ProjectMapWidget /></Suspense>

          <div className="col-span-full grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <Suspense fallback={<WidgetSkeleton />}><MonthlyBudgetWidget data={mockDisbursements} /></Suspense>
            <Suspense fallback={<WidgetSkeleton />}><ValidationHistoryWidget data={mockEvents} /></Suspense>
            <Suspense fallback={<WidgetSkeleton />}><EventChronologyWidget data={mockEvents} /></Suspense>
          </div>

          <div className="col-span-full">
            <Suspense fallback={<WidgetSkeleton />}><ProjectTimelineWidget /></Suspense>
          </div>

        </div>
      </div>

    </div>
  );
}
