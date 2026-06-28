import { Users, UserCheck, UserX, Clock, Shield } from 'lucide-react';
import { StatCard } from '@/components/ui/data-display/StatCard';
import type { UsersKPIs } from '@/mocks/usersMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable KPI strip for the users page
// ─────────────────────────────────────────────────────────────────────────────

export function UserKPIs({ kpis }: { kpis: UsersKPIs }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Utilisateurs"
        value={kpis.total}
        icon={<Users className="h-4 w-4" aria-hidden="true" />}
        iconVariant="primary"
        description="comptes enregistrés"
      />
      <StatCard
        title="Actifs"
        value={kpis.actifs}
        icon={<UserCheck className="h-4 w-4" aria-hidden="true" />}
        iconVariant="success"
        description="accès opérationnel"
      />
      <StatCard
        title="Inactifs / Suspendus"
        value={kpis.inactifs}
        icon={<UserX className="h-4 w-4" aria-hidden="true" />}
        iconVariant="destructive"
        description="accès révoqué"
      />
      <StatCard
        title="En attente"
        value={kpis.enAttente}
        icon={<Clock className="h-4 w-4" aria-hidden="true" />}
        iconVariant="warning"
        description="activation requise"
      />
      <StatCard
        title="Administrateurs"
        value={kpis.administrateurs}
        icon={<Shield className="h-4 w-4" aria-hidden="true" />}
        iconVariant="info"
        description="Super Admin + Admin"
      />
    </div>
  );
}
