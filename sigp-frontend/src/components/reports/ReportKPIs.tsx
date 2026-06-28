import { BarChart2, Download, Star, Calendar } from 'lucide-react';
import { StatCard } from '@/components/ui/data-display/StatCard';
import type { ReportsKPIs } from '@/mocks/reportsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// KPI strip for the Reports page
// ─────────────────────────────────────────────────────────────────────────────

export function ReportKPIs({ kpis }: { kpis: ReportsKPIs }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Modèles disponibles"
        value={kpis.totalTemplates}
        icon={<BarChart2 className="h-4 w-4" aria-hidden="true" />}
        iconVariant="primary"
        description="prêts à générer"
      />
      <StatCard
        title="Générés ce mois"
        value={kpis.generesParMois}
        icon={<Download className="h-4 w-4" aria-hidden="true" />}
        iconVariant="success"
        description="exports réussis"
        trend={{ value: 37, isPositive: true, unit: '%', label: 'vs mois précédent' }}
      />
      <StatCard
        title="Rapports favoris"
        value={kpis.favoris}
        icon={<Star className="h-4 w-4" aria-hidden="true" />}
        iconVariant="warning"
        description="accès rapide"
      />
      <StatCard
        title="Rapports planifiés"
        value={kpis.planifies}
        icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
        iconVariant="info"
        description="fréquence automatique"
      />
    </div>
  );
}
