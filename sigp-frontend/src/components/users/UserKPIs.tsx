import { Users, UserCheck, UserX, Shield, Briefcase } from 'lucide-react';
import { StatCard } from '@/components/ui/data-display/StatCard';
import type { UsersKPIs } from '@/lib/userAdapter';

// ─────────────────────────────────────────────────────────────────────────────
// Bandeau KPI synchronisé avec l'API backend (/users/summary/kpis)
// ─────────────────────────────────────────────────────────────────────────────

export function UserKPIs({ kpis }: { kpis: UsersKPIs | undefined }) {
  const total = kpis?.totalUsers ?? 0;
  const actifs = kpis?.activeUsers ?? 0;
  const inactifs = kpis?.inactiveUsers ?? 0;
  const admins = kpis?.administrators ?? 0;
  const coord = kpis?.coordinators ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Utilisateurs"
        value={total}
        icon={<Users className="h-4 w-4" aria-hidden="true" />}
        iconVariant="primary"
        description="comptes enregistrés"
      />
      <StatCard
        title="Actifs"
        value={actifs}
        icon={<UserCheck className="h-4 w-4" aria-hidden="true" />}
        iconVariant="success"
        description="accès opérationnel"
      />
      <StatCard
        title="Désactivés"
        value={inactifs}
        icon={<UserX className="h-4 w-4" aria-hidden="true" />}
        iconVariant="destructive"
        description="accès révoqué"
      />
      <StatCard
        title="Administrateurs"
        value={admins}
        icon={<Shield className="h-4 w-4" aria-hidden="true" />}
        iconVariant="info"
        description="privilèges étendus"
      />
      <StatCard
        title="Coordinateurs"
        value={coord}
        icon={<Briefcase className="h-4 w-4" aria-hidden="true" />}
        iconVariant="warning"
        description="gestionnaires projets"
      />
    </div>
  );
}
