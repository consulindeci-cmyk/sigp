import { Mail, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/Card';
import { Select } from '@/components/ui/forms/Select';
import { SettingsSwitch } from '@/components/settings/SettingsSwitch';
import type { NotificationPreferences, EmailNotifications, AppNotifications } from '@/mocks/settingsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function NotifRow({
  id, label, description, checked, onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-b-0">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-[11px] text-muted-foreground">{description}</p>
        )}
      </div>
      <SettingsSwitch id={id} checked={checked} onChange={onChange} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsSection
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationsSectionProps {
  notifications: NotificationPreferences;
  onChange: (updated: NotificationPreferences) => void;
}

export function NotificationsSection({ notifications, onChange }: NotificationsSectionProps) {
  function setEmail<K extends keyof EmailNotifications>(key: K, value: boolean) {
    onChange({ ...notifications, email: { ...notifications.email, [key]: value } });
  }

  function setApp<K extends keyof AppNotifications>(key: K, value: boolean) {
    onChange({ ...notifications, app: { ...notifications.app, [key]: value } });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Email notifications */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden="true">
              <Mail className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Notifications par e-mail</CardTitle>
              <CardDescription className="text-[11px]">Activez ou désactivez les e-mails selon vos préférences.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <NotifRow
            id="em-missions"
            label="Nouvelles missions"
            description="Recevoir un e-mail lors de l'affectation à un nouveau projet"
            checked={notifications.email.nouvellesMissions}
            onChange={(v) => setEmail('nouvellesMissions', v)}
          />
          <NotifRow
            id="em-validation"
            label="Validations requises"
            description="Alertes lorsqu'une approbation de votre part est attendue"
            checked={notifications.email.validation}
            onChange={(v) => setEmail('validation', v)}
          />
          <NotifRow
            id="em-budget"
            label="Alertes budgétaires"
            description="Notification lorsqu'un seuil budgétaire critique est atteint"
            checked={notifications.email.alerteBudget}
            onChange={(v) => setEmail('alerteBudget', v)}
          />
          <NotifRow
            id="em-rapport"
            label="Rapports planifiés"
            description="Rapport automatique généré et prêt au téléchargement"
            checked={notifications.email.rapportPlanifie}
            onChange={(v) => setEmail('rapportPlanifie', v)}
          />
          <NotifRow
            id="em-mentions"
            label="Mentions & commentaires"
            description="Notification quand vous êtes mentionné dans un commentaire"
            checked={notifications.email.mentions}
            onChange={(v) => setEmail('mentions', v)}
          />
          <NotifRow
            id="em-resume"
            label="Résumé hebdomadaire"
            description="Récapitulatif des activités de la semaine"
            checked={notifications.email.resumeHebdo}
            onChange={(v) => setEmail('resumeHebdo', v)}
          />

          <div className="mt-4 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="freq-resume">
              Fréquence du résumé
            </label>
            <Select
              id="freq-resume"
              value={notifications.frequenceResume}
              onChange={(e) =>
                onChange({
                  ...notifications,
                  frequenceResume: e.target.value as NotificationPreferences['frequenceResume'],
                })
              }
              className="max-w-xs"
            >
              <option value="Quotidien">Quotidien</option>
              <option value="Hebdomadaire">Hebdomadaire</option>
              <option value="Mensuel">Mensuel</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* In-app notifications */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-success/10 text-success flex items-center justify-center shrink-0" aria-hidden="true">
              <Smartphone className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Notifications dans l'application</CardTitle>
              <CardDescription className="text-[11px]">Alertes visibles directement dans l'interface.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <NotifRow
            id="app-missions"
            label="Nouvelles missions"
            description="Notification en temps réel lors d'une affectation"
            checked={notifications.app.nouvellesMissions}
            onChange={(v) => setApp('nouvellesMissions', v)}
          />
          <NotifRow
            id="app-validation"
            label="Validations requises"
            description="Badge de notification pour les validations en attente"
            checked={notifications.app.validation}
            onChange={(v) => setApp('validation', v)}
          />
          <NotifRow
            id="app-budget"
            label="Alertes budgétaires"
            description="Alerte visuelle sur les dépassements budgétaires"
            checked={notifications.app.alerteBudget}
            onChange={(v) => setApp('alerteBudget', v)}
          />
          <NotifRow
            id="app-mentions"
            label="Mentions & commentaires"
            description="Notification lors d'une mention dans les discussions"
            checked={notifications.app.mentions}
            onChange={(v) => setApp('mentions', v)}
          />
          <NotifRow
            id="app-echeance"
            label="Rappels d'échéances"
            description="Alerte 48h avant la date limite d'une activité"
            checked={notifications.app.rappelEcheance}
            onChange={(v) => setApp('rappelEcheance', v)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
