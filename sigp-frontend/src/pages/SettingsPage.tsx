import { useState, useMemo } from 'react';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { PageHeader } from '@/components/layout/AppShell';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/navigation/Tabs';

import { SettingsKPIs } from '@/components/settings/SettingsKPIs';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { PreferencesSection } from '@/components/settings/PreferencesSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { SecuritySection } from '@/components/settings/SecuritySection';
import { SystemSection } from '@/components/settings/SystemSection';
import { DangerZoneSection } from '@/components/settings/DangerZoneSection';

import {
  mockUserProfile,
  mockUserPreferences,
  mockNotificationPreferences,
  mockActiveSessions,
  mockConnectionHistory,
  mockChangeHistory,
  type UserProfile,
  type UserPreferences,
  type NotificationPreferences,
  type ActiveSession,
  type ChangeHistory,
  type SettingsKPIsData,
} from '@/mocks/settingsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// KPI helpers
// ─────────────────────────────────────────────────────────────────────────────

function calcProfileScore(p: UserProfile): number {
  const fields = [p.prenom, p.nom, p.email, p.telephone, p.poste, p.bio, p.organisation];
  const filled = fields.filter(Boolean).length;
  const hasProjects = p.projetsAffecter.length > 0;
  return Math.min(100, Math.round((filled / fields.length) * 85 + (hasProjects ? 15 : 0)));
}

function countActiveNotifications(n: NotificationPreferences): number {
  const emailActive = Object.values(n.email).filter((v) => v === true).length;
  const appActive   = Object.values(n.app).filter((v) => v === true).length;
  return emailActive + appActive;
}

// ─────────────────────────────────────────────────────────────────────────────
// SettingsPage
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile, setProfile]             = useState<UserProfile>(mockUserProfile);
  const [preferences, setPreferences]     = useState<UserPreferences>(mockUserPreferences);
  const [notifications, setNotifications] = useState<NotificationPreferences>(mockNotificationPreferences);
  const [sessions, setSessions]           = useState<ActiveSession[]>(mockActiveSessions);
  const [connectionHistory]               = useState(mockConnectionHistory);
  const [changeHistory, setChangeHistory] = useState<ChangeHistory[]>(mockChangeHistory);
  const [twoFactor, setTwoFactor]         = useState(false);

  // ── Dynamic KPIs ─────────────────────────────────────────────────────────
  const kpis = useMemo<SettingsKPIsData>(() => ({
    profilScore:             calcProfileScore(profile),
    sessionsActives:         sessions.length,
    notificationsActives:    countActiveNotifications(notifications),
    derniereConnexion:       connectionHistory[0]?.date ?? '—',
  }), [profile, sessions, notifications, connectionHistory]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleProfileSave(updated: UserProfile) {
    const ts = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }) + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setProfile(updated);
    setChangeHistory((h) => [
      {
        id: `ch-${Date.now()}`,
        champ: 'Profil',
        ancienneValeur: `${profile.prenom} ${profile.nom}`,
        nouvelleValeur: `${updated.prenom} ${updated.nom}`,
        date: ts,
      },
      ...h,
    ]);
  }

  function handleTerminateSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function handleTerminateAllSessions() {
    setSessions((prev) => prev.filter((s) => s.courante));
  }

  function handleResetPreferences() {
    setPreferences(mockUserPreferences);
    setNotifications(mockNotificationPreferences);
    setTwoFactor(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ContentLayout>
      <PageHeader
        title="Paramètres"
        subtitle="Configuration du compte, préférences et sécurité"
        className="mb-4"
      />

      <SettingsKPIs kpis={kpis} />

      <Tabs defaultValue="profil">
        <TabsList className="mb-5 flex-wrap h-auto gap-1">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="securite">Sécurité</TabsTrigger>
          <TabsTrigger value="systeme">Système</TabsTrigger>
          <TabsTrigger value="danger">Zone dangereuse</TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <ProfileSection profile={profile} onSave={handleProfileSave} />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesSection preferences={preferences} onSave={setPreferences} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsSection notifications={notifications} onChange={setNotifications} />
        </TabsContent>

        <TabsContent value="securite">
          <SecuritySection
            twoFactor={twoFactor}
            onTwoFactorChange={setTwoFactor}
            sessions={sessions}
            onTerminateSession={handleTerminateSession}
            connectionHistory={connectionHistory}
          />
        </TabsContent>

        <TabsContent value="systeme">
          <SystemSection changeHistory={changeHistory} />
        </TabsContent>

        <TabsContent value="danger">
          <DangerZoneSection
            onResetPreferences={handleResetPreferences}
            onTerminateAllSessions={handleTerminateAllSessions}
          />
        </TabsContent>
      </Tabs>
    </ContentLayout>
  );
}
