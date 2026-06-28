import { Briefcase, TrendingUp, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/ui/data-display/StatCard';
import type { ProjectsKPIs } from '@/mocks/projectsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable KPI strip for portfolio/projects list views
// ─────────────────────────────────────────────────────────────────────────────

export function ProjectKPIs({ kpis }: { kpis: ProjectsKPIs }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Projets"
        value={kpis.total}
        icon={<Briefcase className="h-4 w-4" aria-hidden="true" />}
        iconVariant="primary"
        description="dans le portefeuille"
      />
      <StatCard
        title="En bonne voie"
        value={kpis.enBonneVoie}
        icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
        iconVariant="success"
        description="avancement nominal"
      />
      <StatCard
        title="À risque"
        value={kpis.aRisque}
        icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
        iconVariant="warning"
        description="surveillance renforcée"
      />
      <StatCard
        title="En retard"
        value={kpis.enRetard}
        icon={<Clock className="h-4 w-4" aria-hidden="true" />}
        iconVariant="destructive"
        description="actions correctives requises"
      />
      <StatCard
        title="Budget Portefeuille"
        value={kpis.budgetPortefeuille}
        icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
        iconVariant="default"
        description={`${kpis.clotured} projet(s) clôturé(s)`}
      />
    </div>
  );
}
