import React, { useState } from 'react';
import type { BudgetVersion } from '@/types/budget';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';
import { DashboardToolbar } from '@/components/common/analytics/DashboardToolbar';
import { AnalyticsFilters, FilterGroup } from '@/components/common/analytics/AnalyticsFilters';
import { DashboardSection } from '@/components/common/analytics/DashboardSection';
import { ChartCard } from '@/components/common/analytics/ChartCard';
import { SCurveChart } from '@/components/common/analytics/charts/SCurveChart';
import { BurnRateChart } from '@/components/common/analytics/charts/BurnRateChart';
import { HeatmapChart } from '@/components/common/analytics/charts/HeatmapChart';
import { SunburstChart } from '@/components/common/analytics/charts/SunburstChart';
import { TrendingUp, PieChart, LayoutGrid } from 'lucide-react';

interface BudgetAnalyticsDashboardProps {
  budgetVersion: BudgetVersion;
}

export function BudgetAnalyticsDashboard({ budgetVersion }: BudgetAnalyticsDashboardProps) {
  // Hook d'analyse métier
  const { data, isLoading, error, isEmpty } = useBudgetAnalytics(budgetVersion.id);

  // État local des filtres
  const [filters, setFilters] = useState<Record<string, string>>({
    bailleur: '',
    composante: ''
  });

  const filterGroups: FilterGroup[] = [
    {
      id: 'bailleur',
      label: 'Bailleur',
      value: filters.bailleur,
      options: [
        { id: 'BM', label: 'Banque Mondiale' },
        { id: 'AFD', label: 'AFD' }
      ]
    },
    {
      id: 'composante',
      label: 'Composante',
      value: filters.composante,
      options: [
        { id: 'C1', label: 'Composante 1' },
        { id: 'C2', label: 'Composante 2' }
      ]
    }
  ];

  const handleFilterChange = (groupId: string, value: string) => {
    setFilters(prev => ({ ...prev, [groupId]: value }));
  };

  const handleRefresh = () => {
    // Sera implémenté via un invalidateQueries dans React Query
    console.log('Rafraîchissement...');
  };

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}>
        Une erreur est survenue lors du chargement des analytiques.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--canvas)' }}>
      
      {/* Barre d'outils */}
      <DashboardToolbar 
        title="Dashboard Analytique BI" 
        onRefresh={handleRefresh}
        onExport={() => console.log('Exportation...')}
      />

      {/* Filtres */}
      <AnalyticsFilters 
        groups={filterGroups}
        onChange={handleFilterChange}
      />

      {/* Contenu Scrollable */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }} className="custom-scrollbar">
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Section 1 : Performances Générales */}
          <DashboardSection title="Performances et Décaissements">
            <ChartCard 
              title="Courbe en S (Décaissements vs Prévisions)" 
              icon={<TrendingUp size={16} />}
              isLoading={isLoading}
              isEmpty={isEmpty || !data?.scurve}
              flex="2 1 600px"
              minHeight="350px"
            >
              <SCurveChart data={data?.scurve || []} />
            </ChartCard>

            <ChartCard 
              title="Burn Rate Mensuel" 
              icon={<LayoutGrid size={16} />}
              isLoading={isLoading}
              isEmpty={isEmpty || !data?.burnRate}
              flex="1 1 300px"
              minHeight="350px"
            >
              <BurnRateChart data={data?.burnRate || []} />
            </ChartCard>
          </DashboardSection>

          {/* Section 2 : Répartition Analytique */}
          <DashboardSection title="Répartition Analytique">
            <ChartCard 
              title="Heatmap par Composante / Catégorie" 
              icon={<LayoutGrid size={16} />}
              isLoading={isLoading}
              isEmpty={isEmpty || !data?.heatmap}
              flex="1 1 400px"
              minHeight="300px"
            >
              <HeatmapChart data={data?.heatmap || []} />
            </ChartCard>

            <ChartCard 
              title="Répartition par Bailleur (Sunburst)" 
              icon={<PieChart size={16} />}
              isLoading={isLoading}
              isEmpty={isEmpty || !data?.sunburst}
              flex="1 1 400px"
              minHeight="300px"
            >
              <SunburstChart data={data?.sunburst || []} />
            </ChartCard>
          </DashboardSection>

        </div>
      </div>

    </div>
  );
}
