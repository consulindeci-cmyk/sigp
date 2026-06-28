import { useState } from 'react';
import type { BudgetVersion } from '@/types/budget';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';
import { DashboardToolbar } from '@/components/common/analytics/DashboardToolbar';
import { AnalyticsFilters, type FilterGroup } from '@/components/common/analytics/AnalyticsFilters';
import { DashboardSection } from '@/components/common/analytics/DashboardSection';
import { ChartCard } from '@/components/common/analytics/ChartCard';
import { SCurveChart } from '@/components/common/analytics/charts/SCurveChart';
import { BurnRateChart } from '@/components/common/analytics/charts/BurnRateChart';
import { HeatmapChart } from '@/components/common/analytics/charts/HeatmapChart';
import { SunburstChart } from '@/components/common/analytics/charts/SunburstChart';
import { AlertCircle } from 'lucide-react';
import { TrendingUp, PieChart, LayoutGrid } from 'lucide-react';

interface BudgetAnalyticsDashboardProps {
  budgetVersion: BudgetVersion;
}

export function BudgetAnalyticsDashboard({ budgetVersion }: BudgetAnalyticsDashboardProps) {
  const { data, isLoading, error, isEmpty } = useBudgetAnalytics(budgetVersion.id);

  const [filters, setFilters] = useState<Record<string, string>>({
    bailleur: '',
    composante: '',
  });

  const filterGroups: FilterGroup[] = [
    {
      id: 'bailleur',
      label: 'Bailleur',
      value: filters.bailleur,
      options: [
        { id: 'BM', label: 'Banque Mondiale' },
        { id: 'AFD', label: 'AFD' },
      ],
    },
    {
      id: 'composante',
      label: 'Composante',
      value: filters.composante,
      options: [
        { id: 'C1', label: 'Composante 1' },
        { id: 'C2', label: 'Composante 2' },
      ],
    },
  ];

  const handleFilterChange = (groupId: string, value: string) => {
    setFilters(prev => ({ ...prev, [groupId]: value }));
  };

  const handleRefresh = () => {
    // Sera implémenté via un invalidateQueries dans React Query
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">Erreur de chargement des analytiques</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      <DashboardToolbar
        title="Dashboard Analytique BI"
        onRefresh={handleRefresh}
        onExport={() => undefined}
      />

      <AnalyticsFilters
        groups={filterGroups}
        onChange={handleFilterChange}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-8">

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
