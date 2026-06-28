import { User, Shield, Bell, Clock } from 'lucide-react';
import { StatCard } from '@/components/ui/data-display/StatCard';
import type { SettingsKPIsData } from '@/mocks/settingsMocks';

interface SettingsKPIsProps {
  kpis: SettingsKPIsData;
}

export function SettingsKPIs({ kpis }: SettingsKPIsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Profil complété"
        value={`${kpis.profilScore}%`}
        icon={<User className="h-4 w-4 text-primary" aria-hidden="true" />}
        iconVariant="primary"
        description="des informations renseignées"
      />
      <StatCard
        title="Sessions actives"
        value={kpis.sessionsActives}
        icon={<Shield className="h-4 w-4 text-success" aria-hidden="true" />}
        iconVariant="success"
        description="appareils connectés"
      />
      <StatCard
        title="Notifications actives"
        value={kpis.notificationsActives}
        icon={<Bell className="h-4 w-4 text-warning" aria-hidden="true" />}
        iconVariant="warning"
        description="canaux configurés"
      />
      <StatCard
        title="Dernière connexion"
        value={kpis.derniereConnexion.split(' ')[0]}
        icon={<Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        iconVariant="default"
        description={kpis.derniereConnexion.split(' ').slice(1).join(' ')}
      />
    </div>
  );
}
