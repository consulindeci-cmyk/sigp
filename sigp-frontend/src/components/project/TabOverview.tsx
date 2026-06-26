import React, { Suspense } from 'react';

// Mocks import
import { 
  mockEvmData, mockDisbursements, mockBudgetDistribution, 
  mockFundingDistribution, mockCriticalActivities, mockMainRisks, 
  mockMilestones, mockEvents 
} from '../../mocks/dashboardMocks';

// Lazy load widgets
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

// Skeleton loader for Suspense fallback
const WidgetSkeleton = () => (
  <div className="panel" style={{ height: '100%', minHeight: '150px', background: 'var(--canvas)', borderRadius: '6px', border: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ animation: 'spin 1s linear infinite', color: 'var(--slate)' }}><circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10"/></svg>
  </div>
);

interface TabOverviewProps {
  setActiveTab: (tab: string) => void;
}

export default function TabOverview({ setActiveTab }: TabOverviewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* BLOC 1 : RUBAN KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
        {[
          { label: 'BAC', val: '$24.6M', color: 'var(--navy-900)', target: 'budget' },
          { label: 'Engagé', val: '$18.2M', color: 'var(--navy-700)', target: 'procurement' },
          { label: 'Décaissé', val: '$16.9M', color: 'var(--green)', target: 'disbursements' },
          { label: 'Restant', val: '$7.7M', color: 'var(--slate)', target: 'budget' },
          { label: 'Physique', val: '76%', color: 'var(--red)', target: 'evm' },
          { label: 'Financière', val: '68.7%', color: 'var(--green)', target: 'disbursements' },
          { label: 'Complétude', val: '35%', color: 'var(--amber)', target: 'overview' },
          { label: 'Activités', val: '124', color: 'var(--navy-700)', target: 'activities' },
          { label: 'Livrables', val: '45', color: 'var(--navy-700)', target: 'deliverables' },
          { label: 'Risques', val: '3', color: 'var(--red)', target: 'risks' },
          { label: 'Alertes', val: '2', color: 'var(--red)', target: 'risks' },
        ].map((kpi, idx) => (
          <button key={idx} onClick={() => setActiveTab(kpi.target)} style={{ cursor: 'pointer', background: 'var(--surface)', padding: '12px', borderRadius: '6px', border: '1px solid var(--line-soft)', textAlign: 'center', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '10px', color: 'var(--slate)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>{kpi.label}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: kpi.color }}>{kpi.val}</div>
          </button>
        ))}
      </div>

      {/* BLOC 2 & 3 : INFOS RAPIDES & ALERTES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Infos Rapides */}
        <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--line-soft)' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--navy-900)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            Carte d'Identité
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { k: 'Sponsor', v: 'Ministère de l\'Énergie' },
              { k: 'Zone', v: 'Niger, Diffa & Zinder' },
              { k: 'Statut', v: 'En Exécution' },
              { k: 'Devise', v: 'USD ($)' },
              { k: 'Méthode EVM', v: '0/100 (Livraison stricte)' }
            ].map(i => (
              <div key={i.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--line)', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--slate)' }}>{i.k}</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{i.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes */}
        <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--line-soft)', gridColumn: 'auto / span 2' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--red)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"/></svg>
            Centre d'Alertes Actives
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <button onClick={() => setActiveTab('evm')} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: '12px', background: 'var(--red-bg)', borderRadius: '6px', borderLeft: '3px solid var(--red)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)' }}>Dépassement (SPI)</div>
              <div style={{ fontSize: '11px', color: 'var(--red)' }}>Indice de coût (0.79) critique.</div>
            </button>
            <button onClick={() => setActiveTab('activities')} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: '12px', background: 'var(--amber-bg)', borderRadius: '6px', borderLeft: '3px solid var(--amber)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber)' }}>Activités en retard</div>
              <div style={{ fontSize: '11px', color: 'var(--amber)' }}>14 activités bloquées.</div>
            </button>
            <button onClick={() => setActiveTab('risks')} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: '12px', background: 'var(--red-bg)', borderRadius: '6px', borderLeft: '3px solid var(--red)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)' }}>Risques Majeurs</div>
              <div style={{ fontSize: '11px', color: 'var(--red)' }}>3 risques à probabilité &gt; 80%.</div>
            </button>
            <button onClick={() => setActiveTab('deliverables')} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: '12px', background: 'var(--amber-bg)', borderRadius: '6px', borderLeft: '3px solid var(--amber)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber)' }}>Livrables échus</div>
              <div style={{ fontSize: '11px', color: 'var(--amber)' }}>2 rapports non soumis.</div>
            </button>
          </div>
        </div>

      </div>

      {/* BLOC 4 : MUR DE PERFORMANCE (LAZY LOADED GRILLE DE GRAPHIQUES) */}
      <h3 style={{ fontSize: '16px', color: 'var(--navy-900)', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Performance & Suivi Analytique
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Ligne 1 - EVM & Décaissements */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          <Suspense fallback={<WidgetSkeleton />}><EvmChart data={mockEvmData} /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><DisbursementChart data={mockDisbursements} /></Suspense>
        </div>

        {/* Ligne 2 - Répartitions et Synthèses */}
        <Suspense fallback={<WidgetSkeleton />}><BudgetDistributionChart data={mockBudgetDistribution} /></Suspense>
        <Suspense fallback={<WidgetSkeleton />}><FundingChart data={mockFundingDistribution} /></Suspense>
        <Suspense fallback={<WidgetSkeleton />}><ProgressComparisonChart physical={76} financial={68.7} /></Suspense>
        <Suspense fallback={<WidgetSkeleton />}><BudgetConsumptionWidget consumed={16900000} total={24600000} currency="$" /></Suspense>

        {/* Ligne 3 - Opérationnel & Risques */}
        <Suspense fallback={<WidgetSkeleton />}><CriticalActivitiesWidget data={mockCriticalActivities} /></Suspense>
        <Suspense fallback={<WidgetSkeleton />}><MainRisksWidget data={mockMainRisks} /></Suspense>
        <Suspense fallback={<WidgetSkeleton />}><MilestoneCalendarWidget data={mockMilestones} /></Suspense>
        <Suspense fallback={<WidgetSkeleton />}><ProjectMapWidget /></Suspense>

        {/* Ligne 4 - Historique & Chronologie */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <Suspense fallback={<WidgetSkeleton />}><MonthlyBudgetWidget data={mockDisbursements} /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><ValidationHistoryWidget data={mockEvents} /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><EventChronologyWidget data={mockEvents} /></Suspense>
        </div>

        {/* Ligne 5 - Timeline pleine largeur */}
        <div style={{ gridColumn: '1 / -1' }}>
          <Suspense fallback={<WidgetSkeleton />}><ProjectTimelineWidget /></Suspense>
        </div>

      </div>

    </div>
  );
}
