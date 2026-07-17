import { Building2, CheckCircle2, Ban, Users } from 'lucide-react';
import { StatCard } from '@/components/ui/data-display/StatCard';
import type { OrganisationsKPIs } from '@/lib/organisationAdapter';

export function OrganisationKPIs({ kpis }: { kpis: OrganisationsKPIs | undefined }) {
  const total = kpis?.total ?? 0;
  const actives = kpis?.actives ?? 0;
  const suspendues = kpis?.suspendues ?? 0;
  const utilisateurs = kpis?.utilisateursTotal ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Organisations"
        value={total}
        icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
        iconVariant="primary"
        description="tenants enregistrés"
      />
      <StatCard
        title="Actives"
        value={actives}
        icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
        iconVariant="success"
        description="accès opérationnel"
      />
      <StatCard
        title="Suspendues"
        value={suspendues}
        icon={<Ban className="h-4 w-4" aria-hidden="true" />}
        iconVariant="destructive"
        description="accès bloqué"
      />
      <StatCard
        title="Utilisateurs plateforme"
        value={utilisateurs}
        icon={<Users className="h-4 w-4" aria-hidden="true" />}
        iconVariant="info"
        description="toutes organisations confondues"
      />
    </div>
  );
}
