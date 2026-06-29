import { useState } from 'react';
import { Save, Archive, AlertTriangle, Bell, Settings, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/navigation/Tabs';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Switch inline (no Switch component in design system)
// ─────────────────────────────────────────────────────────────────────────────

function Switch({
  checked,
  onCheckedChange,
  id,
  'aria-label': ariaLabel,
  disabled = false,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  'aria-label'?: string;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      aria-label={ariaLabel}
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row helper
// ─────────────────────────────────────────────────────────────────────────────

function SettingRow({
  label, description, children,
}: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-b-0">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────

interface GeneralSettings {
  nomProjet: string;
  description: string;
  secteur: string;
  pays: string;
  devise: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
}

interface PreferencesSettings {
  langue: string;
  formatDate: string;
  fuseauHoraire: string;
  themeCouleur: string;
}

interface NotificationsSettings {
  notifEmail: boolean;
  notifBudget: boolean;
  notifDelais: boolean;
  notifRapports: boolean;
  notifRisques: boolean;
  frequenceResume: string;
}

interface ArchivageSettings {
  autoArchivage: boolean;
  dureeArchivage: string;
  exportAuto: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────────────

function SectionGenerales({ settings, setSettings }: {
  settings: GeneralSettings;
  setSettings: React.Dispatch<React.SetStateAction<GeneralSettings>>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-foreground" htmlFor="sett-nom">Nom du projet</label>
          <Input id="sett-nom" value={settings.nomProjet}
            onChange={(e) => setSettings((s) => ({ ...s, nomProjet: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-foreground" htmlFor="sett-desc">Description</label>
          <Textarea id="sett-desc" value={settings.description} rows={3}
            onChange={(e) => setSettings((s) => ({ ...s, description: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="sett-secteur">Secteur</label>
          <Select id="sett-secteur" value={settings.secteur}
            onChange={(e) => setSettings((s) => ({ ...s, secteur: e.target.value }))}>
            <option value="Eau & Assainissement">Eau & Assainissement</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Éducation">Éducation</option>
            <option value="Santé">Santé</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Environnement">Environnement</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="sett-pays">Pays</label>
          <Select id="sett-pays" value={settings.pays}
            onChange={(e) => setSettings((s) => ({ ...s, pays: e.target.value }))}>
            <option value="Niger">Niger</option>
            <option value="Mali">Mali</option>
            <option value="Burkina Faso">Burkina Faso</option>
            <option value="Sénégal">Sénégal</option>
            <option value="Côte d'Ivoire">Côte d'Ivoire</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="sett-devise">Devise principale</label>
          <Select id="sett-devise" value={settings.devise}
            onChange={(e) => setSettings((s) => ({ ...s, devise: e.target.value }))}>
            <option value="USD">USD — Dollar américain</option>
            <option value="EUR">EUR — Euro</option>
            <option value="XOF">XOF — Franc CFA</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="sett-statut-gen">Statut du projet</label>
          <Select id="sett-statut-gen" value={settings.statut}
            onChange={(e) => setSettings((s) => ({ ...s, statut: e.target.value }))}>
            <option value="En cours">En cours</option>
            <option value="Suspendu">Suspendu</option>
            <option value="Clôturé">Clôturé</option>
            <option value="Archivé">Archivé</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="sett-debut">Date début</label>
          <Input id="sett-debut" type="date" value={settings.dateDebut}
            onChange={(e) => setSettings((s) => ({ ...s, dateDebut: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="sett-fin">Date fin prévue</label>
          <Input id="sett-fin" type="date" value={settings.dateFin}
            onChange={(e) => setSettings((s) => ({ ...s, dateFin: e.target.value }))} />
        </div>
      </div>
    </div>
  );
}

function SectionPreferences({ settings, setSettings }: {
  settings: PreferencesSettings;
  setSettings: React.Dispatch<React.SetStateAction<PreferencesSettings>>;
}) {
  return (
    <div className="flex flex-col divide-y divide-border">
      <SettingRow label="Langue de l'interface" description="Langue utilisée pour les libellés et rapports">
        <Select value={settings.langue} className="w-36"
          aria-label="Langue"
          onChange={(e) => setSettings((s) => ({ ...s, langue: e.target.value }))}>
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </Select>
      </SettingRow>
      <SettingRow label="Format de date" description="Format d'affichage des dates dans l'application">
        <Select value={settings.formatDate} className="w-36"
          aria-label="Format de date"
          onChange={(e) => setSettings((s) => ({ ...s, formatDate: e.target.value }))}>
          <option value="dd/MM/yyyy">JJ/MM/AAAA</option>
          <option value="MM/dd/yyyy">MM/JJ/AAAA</option>
          <option value="yyyy-MM-dd">AAAA-MM-JJ</option>
        </Select>
      </SettingRow>
      <SettingRow label="Fuseau horaire" description="Fuseau horaire de référence pour les opérations">
        <Select value={settings.fuseauHoraire} className="w-44"
          aria-label="Fuseau horaire"
          onChange={(e) => setSettings((s) => ({ ...s, fuseauHoraire: e.target.value }))}>
          <option value="Africa/Niamey">Afrique/Niamey (UTC+1)</option>
          <option value="Africa/Dakar">Afrique/Dakar (UTC+0)</option>
          <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
          <option value="UTC">UTC</option>
        </Select>
      </SettingRow>
    </div>
  );
}

function SectionNotifications({ settings, setSettings }: {
  settings: NotificationsSettings;
  setSettings: React.Dispatch<React.SetStateAction<NotificationsSettings>>;
}) {
  return (
    <div className="flex flex-col divide-y divide-border">
      <SettingRow label="Notifications par email" description="Recevoir les alertes par courrier électronique">
        <Switch
          checked={settings.notifEmail}
          onCheckedChange={(v) => setSettings((s) => ({ ...s, notifEmail: v }))}
          aria-label="Notifications par email"
        />
      </SettingRow>
      <SettingRow label="Alertes budgétaires" description="Notification quand un seuil budgétaire est dépassé">
        <Switch
          checked={settings.notifBudget}
          onCheckedChange={(v) => setSettings((s) => ({ ...s, notifBudget: v }))}
          aria-label="Alertes budgétaires"
          disabled={!settings.notifEmail}
        />
      </SettingRow>
      <SettingRow label="Alertes délais" description="Notification pour les activités et livrables en retard">
        <Switch
          checked={settings.notifDelais}
          onCheckedChange={(v) => setSettings((s) => ({ ...s, notifDelais: v }))}
          aria-label="Alertes délais"
          disabled={!settings.notifEmail}
        />
      </SettingRow>
      <SettingRow label="Rapports périodiques" description="Réception automatique des rapports de suivi">
        <Switch
          checked={settings.notifRapports}
          onCheckedChange={(v) => setSettings((s) => ({ ...s, notifRapports: v }))}
          aria-label="Rapports périodiques"
          disabled={!settings.notifEmail}
        />
      </SettingRow>
      <SettingRow label="Alertes risques" description="Notification lors de l'élévation du niveau d'un risque">
        <Switch
          checked={settings.notifRisques}
          onCheckedChange={(v) => setSettings((s) => ({ ...s, notifRisques: v }))}
          aria-label="Alertes risques"
          disabled={!settings.notifEmail}
        />
      </SettingRow>
      <SettingRow label="Fréquence résumé" description="Périodicité des emails de résumé automatique">
        <Select value={settings.frequenceResume} className="w-36"
          aria-label="Fréquence résumé"
          disabled={!settings.notifEmail}
          onChange={(e) => setSettings((s) => ({ ...s, frequenceResume: e.target.value }))}>
          <option value="quotidien">Quotidien</option>
          <option value="hebdomadaire">Hebdomadaire</option>
          <option value="mensuel">Mensuel</option>
        </Select>
      </SettingRow>
    </div>
  );
}

function SectionArchivage({ settings, setSettings }: {
  settings: ArchivageSettings;
  setSettings: React.Dispatch<React.SetStateAction<ArchivageSettings>>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col divide-y divide-border">
        <SettingRow label="Archivage automatique" description="Archiver automatiquement les données après la clôture">
          <Switch
            checked={settings.autoArchivage}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, autoArchivage: v }))}
            aria-label="Archivage automatique"
          />
        </SettingRow>
        <SettingRow label="Durée de conservation" description="Durée avant suppression définitive des données archivées">
          <Select value={settings.dureeArchivage} className="w-36"
            aria-label="Durée de conservation"
            disabled={!settings.autoArchivage}
            onChange={(e) => setSettings((s) => ({ ...s, dureeArchivage: e.target.value }))}>
            <option value="1an">1 an</option>
            <option value="3ans">3 ans</option>
            <option value="5ans">5 ans</option>
            <option value="indefini">Indéfini</option>
          </Select>
        </SettingRow>
        <SettingRow label="Export automatique" description="Générer un export PDF à la clôture du projet">
          <Switch
            checked={settings.exportAuto}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, exportAuto: v }))}
            aria-label="Export automatique"
          />
        </SettingRow>
      </div>

      {/* Zone dangereuse */}
      <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5">
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-[13px] font-semibold text-destructive mb-0.5">Zone dangereuse</p>
            <p className="text-[11px] text-muted-foreground">
              Ces actions sont irréversibles. Toutes les données du projet seront définitivement supprimées.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" aria-label="Archiver le projet"
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Archive className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Archiver le projet
          </Button>
          <Button variant="outline" size="sm" aria-label="Fermer le projet"
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Fermer le projet
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionEtatProjet({ statut }: { statut: string }) {
  const isActif = statut === 'En cours';
  const isSuspendu = statut === 'Suspendu';
  const isClos = statut === 'Clôturé' || statut === 'Archivé';

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={cn('flex flex-col gap-2 p-4 rounded-lg border', isActif ? 'border-success/40 bg-success/5' : 'border-border bg-muted/30')}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={cn('h-4 w-4', isActif ? 'text-success' : 'text-muted-foreground')} aria-hidden="true" />
            <span className="text-[12px] font-semibold text-foreground">Actif</span>
            {isActif && <Badge variant="success" className="text-[9px]">Actuel</Badge>}
          </div>
          <p className="text-[11px] text-muted-foreground">Le projet est en cours d'exécution normale.</p>
        </div>
        <div className={cn('flex flex-col gap-2 p-4 rounded-lg border', isSuspendu ? 'border-warning/40 bg-warning/5' : 'border-border bg-muted/30')}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn('h-4 w-4', isSuspendu ? 'text-warning' : 'text-muted-foreground')} aria-hidden="true" />
            <span className="text-[12px] font-semibold text-foreground">Suspendu</span>
            {isSuspendu && <Badge variant="warning" className="text-[9px]">Actuel</Badge>}
          </div>
          <p className="text-[11px] text-muted-foreground">Le projet est temporairement mis en pause.</p>
        </div>
        <div className={cn('flex flex-col gap-2 p-4 rounded-lg border', isClos ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/30')}>
          <div className="flex items-center gap-2">
            <Archive className={cn('h-4 w-4', isClos ? 'text-destructive' : 'text-muted-foreground')} aria-hidden="true" />
            <span className="text-[12px] font-semibold text-foreground">Clôturé</span>
            {isClos && <Badge variant="destructive" className="text-[9px]">Actuel</Badge>}
          </div>
          <p className="text-[11px] text-muted-foreground">Le projet est terminé et archivé.</p>
        </div>
      </div>

      <div className="bg-muted/40 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-[12px] font-medium text-foreground mb-0.5">État actuel</p>
            <p className="text-[11px] text-muted-foreground">
              Le projet est actuellement en statut <strong className="text-foreground">{statut}</strong>.
              Pour modifier le statut, utilisez la section <em>Informations générales</em>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectSettingsTab() {
  const [saved, setSaved] = useState(false);

  const [general, setGeneral] = useState<GeneralSettings>({
    nomProjet: 'Projet ACEFAO — Accès aux Services Essentiels',
    description: "Projet d'amélioration de l'accès aux services d'eau potable, d'énergie solaire et de renforcement des capacités dans les zones rurales du Niger. Financé par AFD, Banque Mondiale et Union Européenne.",
    secteur: 'Eau & Assainissement',
    pays: 'Niger',
    devise: 'USD',
    dateDebut: '2023-01-01',
    dateFin: '2027-06-30',
    statut: 'En cours',
  });

  const [prefs, setPrefs] = useState<PreferencesSettings>({
    langue: 'fr',
    formatDate: 'dd/MM/yyyy',
    fuseauHoraire: 'Africa/Niamey',
    themeCouleur: 'system',
  });

  const [notifs, setNotifs] = useState<NotificationsSettings>({
    notifEmail: true,
    notifBudget: true,
    notifDelais: true,
    notifRapports: false,
    notifRisques: true,
    frequenceResume: 'hebdomadaire',
  });

  const [archivage, setArchivage] = useState<ArchivageSettings>({
    autoArchivage: false,
    dureeArchivage: '5ans',
    exportAuto: true,
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section aria-label="Paramètres du projet" className="flex flex-col gap-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Paramètres du Projet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configuration, préférences, notifications et archivage</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <div className="flex items-center gap-1.5 text-[12px] text-success">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Sauvegardé
            </div>
          )}
          <Button variant="default" size="sm" onClick={handleSave} aria-label="Enregistrer les paramètres">
            <Save className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Enregistrer
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-4">
          <Tabs defaultValue="generales">
            <TabsList className="h-auto flex-wrap gap-1 mb-4">
              <TabsTrigger value="generales">
                <Info className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Informations générales
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Settings className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Préférences
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="archivage">
                <Archive className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Archivage
              </TabsTrigger>
              <TabsTrigger value="etat">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                État du projet
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generales">
              <SectionGenerales settings={general} setSettings={setGeneral} />
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[13px]">Préférences d'affichage</CardTitle>
                </CardHeader>
                <CardContent>
                  <SectionPreferences settings={prefs} setSettings={setPrefs} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[13px]">Paramètres de notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <SectionNotifications settings={notifs} setSettings={setNotifs} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="archivage">
              <SectionArchivage settings={archivage} setSettings={setArchivage} />
            </TabsContent>

            <TabsContent value="etat">
              <SectionEtatProjet statut={general.statut} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
