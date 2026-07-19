import { useState, useMemo } from 'react';
import type { BudgetLigne, BudgetVersion } from '@/types/budget';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';
import { DashboardToolbar } from '@/components/common/analytics/DashboardToolbar';
import { AnalyticsFilters, type FilterGroup } from '@/components/common/analytics/AnalyticsFilters';
import { DashboardSection } from '@/components/common/analytics/DashboardSection';
import { ChartCard } from '@/components/common/analytics/ChartCard';
import { SCurveChart } from '@/components/common/analytics/charts/SCurveChart';
import { BurnRateChart } from '@/components/common/analytics/charts/BurnRateChart';
import { HeatmapChart } from '@/components/common/analytics/charts/HeatmapChart';
import { SunburstChart } from '@/components/common/analytics/charts/SunburstChart';
import { formatMoney } from '@/utils/format';
import { AlertCircle, Check, TrendingUp, PieChart, LayoutGrid, Info } from 'lucide-react';
import { Badge } from '@/components/ui/data-display/Badge';

// ─────────────────────────────────────────────────────────────────────────────
// CSV export helper
// ─────────────────────────────────────────────────────────────────────────────

function downloadAnalyticsCsv(
  scurve:   Array<{ mois: string; prevu: number; engage: number; decaisse: number }>,
  burnRate: Array<{ mois: string; depense: number }>,
  sunburst: Array<{ name: string; value: number }>,
) {
  const sections: string[][] = [
    ['=== Courbe en S (Décaissements vs Prévisions) ==='],
    ['Mois', 'Prévu (VP)', 'Engagé', 'Décaissé'],
    ...scurve.map(r => [r.mois, String(r.prevu), String(r.engage), String(r.decaisse)]),
    [],
    ['=== Burn Rate Mensuel ==='],
    ['Mois', 'Dépense'],
    ...burnRate.map(r => [r.mois, String(r.depense)]),
    [],
    ['=== Répartition par Bailleur ==='],
    ['Bailleur', 'Montant'],
    ...sunburst.map(r => [r.name, String(r.value)]),
  ];

  const csv = '﻿' + sections
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `analytics-budget-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI strip
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?:  string;
  icon:  React.ReactNode;
  color: 'primary' | 'warning' | 'success' | 'muted';
}

function KpiCard({ label, value, sub, icon, color }: KpiCardProps) {
  const colorClass: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
    muted:   'text-muted-foreground bg-muted/40',
  };
  const textClass: Record<string, string> = {
    primary: 'text-primary',
    warning: 'text-warning',
    success: 'text-success',
    muted:   'text-muted-foreground',
  };
  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex items-start gap-3 min-w-0">
      <div className={`shrink-0 p-2 rounded-md ${colorClass[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground leading-tight mb-0.5 truncate">{label}</p>
        <p className={`font-mono text-sm font-bold truncate ${textClass[color]}`}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface BudgetAnalyticsDashboardProps {
  budgetVersion: BudgetVersion;
  lignes?:       BudgetLigne[];
}

export function BudgetAnalyticsDashboard({ budgetVersion, lignes }: BudgetAnalyticsDashboardProps) {
  const { data, isLoading, error, isEmpty, refetch } = useBudgetAnalytics(budgetVersion.id);

  const [filters, setFilters] = useState<Record<string, string>>({
    bailleur:   '',
    composante: '',
  });

  const [refreshed, setRefreshed] = useState(false);
  const [exported,  setExported]  = useState(false);

  // ── Live KPIs from local lignes ───────────────────────────────────────────
  const liveKpis = useMemo(() => {
    const src = lignes ?? budgetVersion.lignes ?? [];
    const totalRevise   = src.reduce((s, l) => s + l.montant_revise,     0);
    const totalEngage   = src.reduce((s, l) => s + l.montant_engage,     0);
    const totalDecaisse = src.reduce((s, l) => s + l.montant_decaisse,   0);
    const resteEngager  = Math.max(0, totalRevise - totalEngage);
    const tauxEngagement  = totalRevise > 0 ? (totalEngage   / totalRevise * 100) : 0;
    const tauxDecaissement = totalRevise > 0 ? (totalDecaisse / totalRevise * 100) : 0;
    const burnRateMensuel = data?.kpis.burnRateMensuel ?? 0;
    return { totalRevise, totalEngage, totalDecaisse, resteEngager, tauxEngagement, tauxDecaissement, burnRateMensuel };
  }, [lignes, budgetVersion.lignes, data]);

  const filterGroups: FilterGroup[] = [
    {
      id:      'bailleur',
      label:   'Bailleur',
      value:   filters.bailleur,
      options: [
        { id: 'BM',   label: 'Banque Mondiale' },
        { id: 'AFD',  label: 'AFD'             },
        { id: 'ETAT', label: 'État'            },
      ],
    },
    {
      id:      'composante',
      label:   'Composante',
      value:   filters.composante,
      options: [
        { id: 'C1',  label: 'Composante 1' },
        { id: 'C2',  label: 'Composante 2' },
        { id: 'C3',  label: 'Composante 3' },
        { id: 'UGP', label: 'UGP'          },
      ],
    },
  ];

  function handleFilterChange(groupId: string, value: string) {
    setFilters(prev => ({ ...prev, [groupId]: value }));
  }

  function handleRefresh() {
    void refetch();
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 2000);
  }

  function handleExport() {
    if (!data) return;
    downloadAnalyticsCsv(
      data.scurve   || [],
      data.burnRate || [],
      data.sunburst || [],
    );
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  const filteredHeatmap = useMemo(() => {
    if (!data?.heatmap) return [];
    if (!filters.composante) return data.heatmap;
    const target = filters.composante.replace('C', 'Composante ').toUpperCase();
    return data.heatmap.filter(row => row.name.toUpperCase().includes(target));
  }, [data?.heatmap, filters.composante]);

  const filteredSunburst = useMemo(() => {
    if (!data?.sunburst) return [];
    if (!filters.bailleur) return data.sunburst;
    const BAILLEUR_NAMES: Record<string, string> = {
      BM:   'Banque Mondiale',
      AFD:  'AFD',
      ETAT: 'État',
    };
    const targetName = BAILLEUR_NAMES[filters.bailleur];
    return targetName ? data.sunburst.filter(r => r.name === targetName) : data.sunburst;
  }, [data?.sunburst, filters.bailleur]);

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

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4 border-b border-border bg-muted/10">
        <KpiCard
          label="Budget révisé (BAC)"
          value={formatMoney(liveKpis.totalRevise)}
          icon={<LayoutGrid className="h-4 w-4" />}
          color="primary"
        />
        <KpiCard
          label="Taux d'engagement"
          value={`${liveKpis.tauxEngagement.toFixed(1)} %`}
          sub={`${formatMoney(liveKpis.totalEngage)} engagés`}
          icon={<TrendingUp className="h-4 w-4" />}
          color="warning"
        />
        <KpiCard
          label="Taux de décaissement"
          value={`${liveKpis.tauxDecaissement.toFixed(1)} %`}
          sub={`${formatMoney(liveKpis.totalDecaisse)} décaissés`}
          icon={<Check className="h-4 w-4" />}
          color="success"
        />
        <KpiCard
          label="Reste à engager"
          value={formatMoney(liveKpis.resteEngager)}
          sub={liveKpis.burnRateMensuel > 0 ? `Burn rate : ${formatMoney(liveKpis.burnRateMensuel)}/mois` : undefined}
          icon={<PieChart className="h-4 w-4" />}
          color="muted"
        />
      </div>

      <DashboardToolbar
        title="Dashboard Analytique BI"
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      <div className="shrink-0 mx-6 mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <Badge variant="outline" className="mr-1.5 text-[10px] align-middle">Démo</Badge>
          Les graphiques ci-dessous (Courbe en S, Burn Rate, Heatmap, Sunburst) utilisent des données de démonstration, pas encore les vraies transactions du projet. Seule la bande de KPI ci-dessus reflète les montants réels.
        </span>
      </div>

      <AnalyticsFilters
        groups={filterGroups}
        onChange={handleFilterChange}
      />

      {(refreshed || exported) && (
        <div className="shrink-0 mx-6 mt-3 flex items-center gap-2 text-success text-xs bg-success/10 border border-success/20 rounded-md px-3 py-2">
          <Check className="h-3.5 w-3.5" />
          {refreshed ? 'Données actualisées avec succès.' : 'Export CSV téléchargé avec succès.'}
        </div>
      )}

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
              isEmpty={isEmpty || filteredHeatmap.length === 0}
              flex="1 1 400px"
              minHeight="300px"
            >
              <HeatmapChart data={filteredHeatmap} />
            </ChartCard>

            <ChartCard
              title="Répartition par Bailleur (Sunburst)"
              icon={<PieChart size={16} />}
              isLoading={isLoading}
              isEmpty={isEmpty || filteredSunburst.length === 0}
              flex="1 1 400px"
              minHeight="300px"
            >
              <SunburstChart data={filteredSunburst} />
            </ChartCard>
          </DashboardSection>

        </div>
      </div>

    </div>
  );
}
