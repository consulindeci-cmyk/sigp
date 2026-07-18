import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  User, Shield, Bell, Palette, Building2, Database, Archive,
  Lock, SlidersHorizontal, Plug, Info, AlertTriangle,
  Save, CheckCircle2, Key, Laptop,
  LogOut, RotateCcw, UserX, Trash2, Eye, EyeOff, Copy,
  Download, Globe, Mail, Phone,
  ExternalLink, ChevronRight, Sun, Moon, Monitor,
} from 'lucide-react';
import { Button }   from '@/components/ui/forms/Button';
import { Input }    from '@/components/ui/forms/Input';
import { Select }   from '@/components/ui/forms/Select';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Badge }    from '@/components/ui/data-display/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/Card';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { SettingsSwitch } from '@/components/settings/SettingsSwitch';
import { userAvatarStyle } from '@/components/users/userAvatarStyle';
import {
  usePrefsStore, applyThemeClass,
  type Theme,
} from '@/stores/prefsStore';
import {
  LANGUES, TIMEZONES, FORMATS_DATE, DEVISES,
  type UserProfile,
} from '@/mocks/settingsMocks';
import { useCurrentUserProfile, useUpdateProfile } from '@/hooks/useUserProfile';
import { useLoginHistory } from '@/hooks/useLoginHistory';
import { useOrganisation, useUpdateOrganisation, type Organisation } from '@/hooks/useOrganisation';
import { useDeleteUser } from '@/hooks/useUsers';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';

// ─── Types nav ────────────────────────────────────────────────────────────────

type SectionId =
  | 'compte' | 'securite' | 'notifications' | 'apparence'
  | 'organisation' | 'sauvegarde' | 'archivage' | 'confidentialite'
  | 'preferences' | 'integrations' | 'apropos' | 'danger';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
}

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: 'Compte',
    items: [
      { id: 'compte',        label: 'Mon compte',     icon: User },
      { id: 'securite',      label: 'Sécurité',       icon: Shield },
      { id: 'notifications', label: 'Notifications',  icon: Bell },
      { id: 'apparence',     label: 'Apparence',      icon: Palette },
    ],
  },
  {
    group: 'Plateforme',
    items: [
      { id: 'organisation',    label: 'Organisation',    icon: Building2 },
      { id: 'sauvegarde',      label: 'Sauvegarde',      icon: Database },
      { id: 'archivage',       label: 'Archivage',       icon: Archive },
      { id: 'confidentialite', label: 'Confidentialité', icon: Lock },
    ],
  },
  {
    group: 'Avancé',
    items: [
      { id: 'preferences',  label: 'Préférences',     icon: SlidersHorizontal },
      { id: 'integrations', label: 'Intégrations',    icon: Plug },
      { id: 'apropos',      label: 'À propos',        icon: Info },
      { id: 'danger',       label: 'Zone dangereuse', icon: AlertTriangle, danger: true },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function SaveRow({ saving, saved, onSave, label = 'Enregistrer' }: {
  saving: boolean; saved: boolean; onSave: () => void; label?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      {saved && (
        <span className="flex items-center gap-1.5 text-sm text-success" aria-live="polite">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Modifications enregistrées
        </span>
      )}
      <Button variant="default" onClick={onSave} disabled={saving} leftIcon={<Save className="h-4 w-4" />}>
        {saving ? 'Enregistrement...' : label}
      </Button>
    </div>
  );
}

// ─── OptionCard ───────────────────────────────────────────────────────────────

function OptionCard<T extends string>({
  value, current, onChange, label, icon, description,
}: {
  value: T; current: T; onChange: (v: T) => void;
  label: string; icon: React.ReactNode; description?: string;
}) {
  const selected = value === current;
  return (
    <button type="button" onClick={() => onChange(value)} aria-pressed={selected}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all text-center w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
      )}
    >
      <div className="h-8 w-8 flex items-center justify-center" aria-hidden="true">{icon}</div>
      <span className="text-[12px] font-semibold">{label}</span>
      {description && <span className="text-[10px] text-muted-foreground">{description}</span>}
    </button>
  );
}

// ─── Section: Mon compte ──────────────────────────────────────────────────────

interface MonCompteSectionProps {
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
}

interface MfaEnrollment { factorId: string; qrCode: string; secret: string }

function MonCompteSection({ profile, onSave }: MonCompteSectionProps) {
  const [form, setForm]     = useState<UserProfile>({ ...profile });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone,   setPwDone]   = useState(false);

  const [twoFactor, setTwoFactor]           = useState(false);
  const [mfaLoading, setMfaLoading]         = useState(true);
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment]         = useState<MfaEnrollment | null>(null);
  const [mfaCode, setMfaCode]               = useState('');
  const [mfaError, setMfaError]             = useState('');
  const [mfaBusy, setMfaBusy]               = useState(false);

  useEffect(() => { setForm({ ...profile }); }, [profile]);
  const avatarStyle = userAvatarStyle(profile.initiales);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find(f => f.status === 'verified');
      if (!cancelled && verified) { setTwoFactor(true); setVerifiedFactorId(verified.id); }
      if (!cancelled) setMfaLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleSave() {
    setSaving(true); setSaved(false);
    setTimeout(() => { onSave(form); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000); }, 800);
  }

  async function handlePasswordChange() {
    if (!pwForm.current)            { setPwError('Mot de passe actuel requis.'); return; }
    if (pwForm.next.length < 8)     { setPwError('Minimum 8 caractères.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Les mots de passe ne correspondent pas.'); return; }
    setPwError(''); setPwSaving(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email, password: pwForm.current,
    });
    if (signInError) {
      setPwSaving(false);
      setPwError('Mot de passe actuel incorrect.');
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwSaving(false);
    if (updateError) { setPwError(updateError.message); return; }
    setPwDone(true);
    setPwForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setPwDone(false), 4000);
  }

  async function handleToggle2FA(v: boolean) {
    setMfaError('');
    if (v) {
      setMfaBusy(true);
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      setMfaBusy(false);
      if (error || !data) { setMfaError(error?.message ?? "Erreur lors de l'enrôlement."); return; }
      setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    } else {
      if (verifiedFactorId) {
        setMfaBusy(true);
        await supabase.auth.mfa.unenroll({ factorId: verifiedFactorId });
        setMfaBusy(false);
        setVerifiedFactorId(null);
      }
      setTwoFactor(false);
      setEnrollment(null);
    }
  }

  async function handleVerifyMfa() {
    if (!enrollment) return;
    setMfaBusy(true); setMfaError('');
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.factorId, code: mfaCode });
    setMfaBusy(false);
    if (error) { setMfaError('Code invalide.'); return; }
    setVerifiedFactorId(enrollment.factorId);
    setTwoFactor(true);
    setEnrollment(null);
    setMfaCode('');
  }

  async function handleCancelEnrollment() {
    if (enrollment) {
      setMfaBusy(true);
      await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
      setMfaBusy(false);
    }
    setEnrollment(null);
    setMfaCode('');
    setMfaError('');
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Mon compte" description="Informations personnelles, mot de passe et double authentification." />

      {/* Avatar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className={cn('h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold shrink-0 select-none', avatarStyle)}
              aria-label={`Avatar de ${profile.prenom} ${profile.nom}`}>
              {profile.initiales}
            </div>
            <div className="flex flex-col gap-1.5 text-center sm:text-left">
              <h2 className="text-xl font-semibold text-foreground">{profile.prenom} {profile.nom}</h2>
              <p className="text-sm text-muted-foreground">{profile.poste}</p>
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start mt-0.5">
                <Badge variant="secondary">{profile.roleLabel}</Badge>
                <Badge variant={profile.actif ? 'success' : 'destructive'}>{profile.actif ? 'Actif' : 'Inactif'}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Inscrit le {profile.dateInscription} · Dernière connexion {profile.dernierAcces}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="mc-prenom">Prénom</label>
              <Input id="mc-prenom" value={form.prenom} onChange={e => set('prenom', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="mc-nom">Nom</label>
              <Input id="mc-nom" value={form.nom} onChange={e => set('nom', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="flex items-center h-9 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground select-none">
                {profile.email}
              </div>
              <p className="text-[10px] text-muted-foreground">Non modifiable depuis cette page.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="mc-tel">Téléphone</label>
              <Input id="mc-tel" type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="mc-poste">Poste / Fonction</label>
              <Input id="mc-poste" value={form.poste} onChange={e => set('poste', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Organisation</label>
              <div className="flex items-center h-9 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground select-none">
                {profile.organisation}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Rôle</label>
              <div className="flex items-center h-9 rounded-md border border-border bg-muted/50 px-3">
                <Badge variant="secondary" className="text-xs">{profile.roleLabel}</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="mc-bio">Bio</label>
              <Textarea id="mc-bio" rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} className="resize-none" />
            </div>
          </div>
          <SaveRow saving={saving} saved={saved} onSave={handleSave} />
        </CardContent>
      </Card>

      {/* Mot de passe */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <Key className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">Changer le mot de passe</CardTitle>
              <CardDescription className="text-[11px]">Minimum 8 caractères. ✅ Fonctionnel — via Supabase Auth.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pwDone ? (
            <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-4 py-3 border border-success/20" aria-live="polite">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Mot de passe modifié avec succès.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="pw-cur">Actuel</label>
                  <Input id="pw-cur" type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} autoComplete="current-password" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="pw-new">Nouveau</label>
                  <Input id="pw-new" type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} autoComplete="new-password" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="pw-cfm">Confirmer</label>
                  <Input id="pw-cfm" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} autoComplete="new-password" />
                </div>
              </div>
              {pwError && <p className="text-sm text-destructive" role="alert">{pwError}</p>}
              <div className="flex justify-end">
                <Button variant="default" onClick={handlePasswordChange} disabled={pwSaving}>
                  {pwSaving ? 'Enregistrement...' : 'Modifier le mot de passe'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">Double authentification (2FA)</CardTitle>
              <CardDescription className="text-[11px]">✅ Fonctionnel — TOTP réel via Supabase Auth.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">Activer la 2FA</p>
              <p className="text-[11px] text-muted-foreground">
                {twoFactor ? '2FA active sur votre compte.' : 'Protégez votre compte avec Google Authenticator, Authy…'}
              </p>
            </div>
            <SettingsSwitch id="mc-2fa" checked={twoFactor} onChange={handleToggle2FA} disabled={mfaLoading || mfaBusy || !!enrollment} />
          </div>
          {mfaError && <p className="text-xs text-destructive mb-3" role="alert">{mfaError}</p>}
          {enrollment && (
            <div className="flex flex-col items-center gap-3 border border-border rounded-lg p-5 bg-muted/20">
              <img
                src={enrollment.qrCode} alt="QR code 2FA"
                className="h-32 w-32 border-2 border-border rounded-md bg-background"
              />
              <code className="font-mono text-[12px] bg-muted px-2 py-0.5 rounded text-foreground">{enrollment.secret}</code>
              <div className="flex flex-col gap-1.5 w-full max-w-[220px]">
                <label className="text-xs font-medium text-foreground" htmlFor="mfa-code">Code à 6 chiffres</label>
                <Input
                  id="mfa-code" value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                  maxLength={6} placeholder="123456" className="font-mono text-center"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEnrollment} disabled={mfaBusy}>Annuler</Button>
                <Button size="sm" onClick={handleVerifyMfa} disabled={mfaBusy || mfaCode.length !== 6}>
                  {mfaBusy ? 'Vérification...' : 'Vérifier et activer'}
                </Button>
              </div>
            </div>
          )}
          {twoFactor && !enrollment && (
            <Badge variant="success" className="text-xs">2FA activée</Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Section: Sécurité ────────────────────────────────────────────────────────

interface SecuriteSectionProps {
  userId: string | undefined;
  onTerminateOthers: () => Promise<void>;
}

function SecuriteSection({ userId, onTerminateOthers }: SecuriteSectionProps) {
  const { data: history = [] } = useLoginHistory(userId);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [done, setDone] = useState(false);

  async function handleTerminate() {
    setTerminating(true);
    await onTerminateOthers();
    setTerminating(false); setTerminateOpen(false); setDone(true);
    setTimeout(() => setDone(false), 4000);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Sécurité" description="Déconnexion à distance et historique des connexions." />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-info/10 text-info flex items-center justify-center shrink-0">
              <Laptop className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">Autres appareils</CardTitle>
              <CardDescription className="text-[11px]">
                Supabase ne permet pas de lister les appareils connectés individuellement — seule une déconnexion globale des autres sessions est possible.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {done && <span className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Autres appareils déconnectés</span>}
            <Button variant="outline" size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
              onClick={() => setTerminateOpen(true)}>
              Déconnecter tous les autres appareils
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique des connexions</CardTitle>
          <CardDescription className="text-[11px]">{history.length} dernière{history.length > 1 ? 's' : ''} connexion{history.length > 1 ? 's' : ''} réussie{history.length > 1 ? 's' : ''}.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune connexion enregistrée pour l'instant.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {history.map(entry => (
                <div key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                  <p className="text-[12px] font-medium text-foreground">{entry.navigateur}</p>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {new Date(entry.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={terminateOpen} onOpenChange={setTerminateOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Déconnecter tous les autres appareils ?</ModalTitle>
            <ModalDescription>Toutes les sessions actives sauf celle-ci seront déconnectées.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Annuler</Button></ModalClose>
            <Button variant="destructive" onClick={handleTerminate} disabled={terminating} leftIcon={<LogOut className="h-4 w-4" />}>
              {terminating ? 'Déconnexion...' : 'Déconnecter'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

// ─── Section: Notifications — connectée à prefsStore ─────────────────────────

function NotificationsSection() {
  const { notifs, setNotifs } = usePrefsStore();
  const [saved, setSaved] = useState(false);

  function setChannel<K extends keyof typeof notifs.channels>(k: K, v: boolean) {
    setNotifs({ ...notifs, channels: { ...notifs.channels, [k]: v } });
    flash();
  }

  function setAlert<K extends keyof typeof notifs.alerts>(k: K, enabled: boolean) {
    setNotifs({ ...notifs, alerts: { ...notifs.alerts, [k]: { ...notifs.alerts[k], enabled } } });
    flash();
  }

  function setAlertChannel<K extends keyof typeof notifs.alerts>(
    alertKey: K, channel: 'email' | 'push', v: boolean,
  ) {
    setNotifs({
      ...notifs,
      alerts: {
        ...notifs.alerts,
        [alertKey]: { ...notifs.alerts[alertKey], channels: { ...notifs.alerts[alertKey].channels, [channel]: v } },
      },
    });
    flash();
  }

  function setEmailFreq(freq: string) {
    setNotifs({ ...notifs, emailFreq: freq });
    flash();
  }

  function setDnd<K extends keyof typeof notifs.dnd>(k: K, v: typeof notifs.dnd[K]) {
    setNotifs({ ...notifs, dnd: { ...notifs.dnd, [k]: v } });
    flash();
  }

  function flash() {
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  const alertDefs: { key: keyof typeof notifs.alerts; label: string; desc: string }[] = [
    { key: 'budget',      label: 'Alertes budgétaires',    desc: 'Dépassement de seuil budgétaire' },
    { key: 'tresorerie',  label: 'Trésorerie',              desc: 'Alerte de trésorerie critique' },
    { key: 'validations', label: 'Validations',             desc: 'Approbation requise de votre part' },
    { key: 'rapports',    label: 'Rapports planifiés',      desc: 'Rapport généré et prêt' },
    { key: 'risques',     label: 'Risques',                 desc: 'Nouveau risque élevé détecté' },
    { key: 'echeances',   label: 'Échéances',               desc: 'Rappel 48h avant la date limite' },
    { key: 'mentions',    label: 'Mentions',                desc: 'Vous avez été mentionné' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Notifications" description="Configurez vos canaux et alertes. Sauvegarde automatique dans le store local." />

      {saved && (
        <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-3 py-2 border border-success/20" aria-live="polite">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Préférences de notification enregistrées.
        </div>
      )}

      {/* Canaux globaux */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Canaux de notification</CardTitle>
          <CardDescription className="text-[11px]">Activez ou désactivez les canaux globalement.</CardDescription>
        </CardHeader>
        <CardContent>
          {([
            { key: 'email' as const, label: 'Email',       desc: "Notifications par e-mail" },
            { key: 'push'  as const, label: 'Navigateur',  desc: "Notifications push dans le navigateur" },
            { key: 'sms'   as const, label: 'SMS',         desc: "Alertes critiques par SMS" },
          ]).map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-b-0">
              <div>
                <label htmlFor={`ch-${item.key}`} className="text-sm font-medium text-foreground cursor-pointer">{item.label}</label>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <SettingsSwitch id={`ch-${item.key}`} checked={notifs.channels[item.key]} onChange={v => setChannel(item.key, v)} />
            </div>
          ))}
          <div className="flex flex-col gap-1.5 mt-4">
            <label className="text-sm font-medium text-foreground" htmlFor="email-freq">Fréquence des e-mails</label>
            <Select id="email-freq" value={notifs.emailFreq} onChange={e => setEmailFreq(e.target.value)} className="max-w-xs">
              <option value="Immédiat">Immédiat</option>
              <option value="Toutes les heures">Toutes les heures</option>
              <option value="Quotidien">Résumé quotidien</option>
              <option value="Hebdomadaire">Résumé hebdomadaire</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alertes par événement */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alertes par événement</CardTitle>
          <CardDescription className="text-[11px]">Activez les alertes et choisissez les canaux par type d'événement.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {alertDefs.map(def => {
              const alert = notifs.alerts[def.key];
              return (
                <div key={def.key} className="py-3 border-b border-border last:border-b-0">
                  <div className="flex items-center justify-between gap-4 mb-1.5">
                    <div>
                      <label htmlFor={`al-${def.key}`} className="text-sm font-medium text-foreground cursor-pointer">{def.label}</label>
                      <p className="text-[11px] text-muted-foreground">{def.desc}</p>
                    </div>
                    <SettingsSwitch id={`al-${def.key}`} checked={alert.enabled} onChange={v => setAlert(def.key, v)} />
                  </div>
                  {alert.enabled && (
                    <div className="flex items-center gap-4 pl-2 mt-1">
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                        <SettingsSwitch id={`al-${def.key}-email`} checked={alert.channels.email} onChange={v => setAlertChannel(def.key, 'email', v)} />
                        <span>Email</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                        <SettingsSwitch id={`al-${def.key}-push`} checked={alert.channels.push} onChange={v => setAlertChannel(def.key, 'push', v)} />
                        <span>Push</span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ne pas déranger */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ne pas déranger</CardTitle>
          <CardDescription className="text-[11px]">Suspendre toutes les notifications pendant une plage horaire.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Activer le mode Ne pas déranger</p>
              <p className="text-[11px] text-muted-foreground">Aucune notification pendant la plage définie.</p>
            </div>
            <SettingsSwitch id="dnd-enabled" checked={notifs.dnd.enabled} onChange={v => setDnd('enabled', v)} />
          </div>
          {notifs.dnd.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="dnd-start">De</label>
                <Input id="dnd-start" type="time" value={notifs.dnd.start} onChange={e => setDnd('start', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="dnd-end">À</label>
                <Input id="dnd-end" type="time" value={notifs.dnd.end} onChange={e => setDnd('end', e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Section: Apparence — connectée à prefsStore ──────────────────────────────

function ApparenceSection() {
  const { theme, setTheme, region, display, setPrefs } = usePrefsStore();
  const [saved, setSaved] = useState(false);

  function handleTheme(t: Theme) {
    setTheme(t);
    applyThemeClass(t);
    flash();
  }

  function setRegion<K extends keyof typeof region>(k: K, v: string) {
    setPrefs({ region: { ...region, [k]: v } });
    flash();
  }

  function setDensity(density: string) {
    setPrefs({ display: { ...display, density } });
    flash();
  }

  function flash() {
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Apparence" description="Thème, langue, fuseau horaire et formats d'affichage. Sauvegarde automatique." />

      {saved && (
        <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-3 py-2 border border-success/20" aria-live="polite">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Préférences enregistrées et appliquées.
        </div>
      )}

      {/* Thème */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thème de l'interface</CardTitle>
          <CardDescription className="text-[11px]">✅ Fonctionnel — modifie immédiatement toute l'application et persiste.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            <OptionCard<Theme>
              value="light" current={theme} onChange={handleTheme}
              label="Clair" icon={<Sun className="h-5 w-5" />} description="Toujours clair"
            />
            <OptionCard<Theme>
              value="dark" current={theme} onChange={handleTheme}
              label="Sombre" icon={<Moon className="h-5 w-5" />} description="Toujours sombre"
            />
            <OptionCard<Theme>
              value="auto" current={theme} onChange={handleTheme}
              label="Système" icon={<Monitor className="h-5 w-5" />} description="Automatique"
            />
          </div>
        </CardContent>
      </Card>

      {/* Densité */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Densité d'affichage</CardTitle>
          <CardDescription className="text-[11px]">✅ Fonctionnel — valeur persistée, lisible par les composants via le store.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            {([
              { v: 'Compact',       label: 'Compacte', desc: "Plus d'info" },
              { v: 'Confortable',   label: 'Normal',   desc: 'Équilibré' },
              { v: 'Très aéré',     label: 'Aéré',     desc: "Plus d'espace" },
            ] as const).map(({ v, label, desc }) => (
              <OptionCard<string>
                key={v} value={v} current={display.density} onChange={setDensity}
                label={label} description={desc}
                icon={
                  <div className="flex flex-col gap-0.5 w-7" aria-hidden="true">
                    {Array.from({ length: v === 'Compact' ? 5 : v === 'Confortable' ? 4 : 3 }).map((_, i) => (
                      <div key={i} className="h-1 w-full rounded-full bg-current opacity-60" />
                    ))}
                  </div>
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Langue & région */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Langue et région</CardTitle>
          <CardDescription className="text-[11px]">✅ Fonctionnel — valeurs persistées dans le store local.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="ap-lang">Langue</label>
              <Select id="ap-lang" value={region.lang} onChange={e => setRegion('lang', e.target.value)}>
                {LANGUES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="ap-tz">Fuseau horaire</label>
              <Select id="ap-tz" value={region.timezone} onChange={e => setRegion('timezone', e.target.value)}>
                {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="ap-date">Format de date</label>
              <Select id="ap-date" value={region.dateFormat} onChange={e => setRegion('dateFormat', e.target.value)}>
                {FORMATS_DATE.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="ap-devise">Devise</label>
              <Select id="ap-devise" value={region.currency} onChange={e => setRegion('currency', e.target.value)}>
                {DEVISES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="ap-nb">Format des nombres</label>
              <Select id="ap-nb" value={region.numberFormat} onChange={e => setRegion('numberFormat', e.target.value)}>
                <option value="1 234 567,89">Français — 1 234 567,89</option>
                <option value="1,234,567.89">Anglais — 1,234,567.89</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Section: Organisation ────────────────────────────────────────────────────

const EMPTY_ORG: Organisation = {
  id: '', nom: '', adresse: '', ville: '', pays: '', telephone: '', email: '', siteWeb: '', deviseDefaut: 'XOF',
};

function OrgSection({ role }: { role: string }) {
  const isAdmin = role === 'ADMIN';
  const { data: organisation, isLoading } = useOrganisation();
  const updateMutation = useUpdateOrganisation();
  const [form, setForm]     = useState<Organisation>(EMPTY_ORG);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => { if (organisation) setForm(organisation); }, [organisation]);

  function set<K extends keyof Organisation>(k: K, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function handleSave() {
    setSaved(false);
    updateMutation.mutate({
      nom: form.nom, adresse: form.adresse, ville: form.ville, pays: form.pays,
      telephone: form.telephone, email: form.email, siteWeb: form.siteWeb,
    }, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Organisation" description="Informations officielles. ✅ Fonctionnel — table organisations, réservé aux ADMIN." />
      <Card>
        <CardContent className="pt-6">
          {!isAdmin ? (
            <p className="text-sm text-muted-foreground">Réservé à l'administrateur de l'organisation.</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="org-nom">Nom de l'organisation</label>
                  <Input id="org-nom" value={form.nom} onChange={e => set('nom', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="org-adr">Adresse</label>
                  <Input id="org-adr" value={form.adresse} onChange={e => set('adresse', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="org-ville">Ville</label>
                  <Input id="org-ville" value={form.ville} onChange={e => set('ville', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="org-pays">Pays</label>
                  <Input id="org-pays" value={form.pays} onChange={e => set('pays', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="org-tel">
                    <Phone className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" aria-hidden="true" />Téléphone
                  </label>
                  <Input id="org-tel" type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="org-email">
                    <Mail className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" aria-hidden="true" />Email
                  </label>
                  <Input id="org-email" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="org-web">
                    <Globe className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" aria-hidden="true" />Site Web
                  </label>
                  <Input id="org-web" type="url" value={form.siteWeb} onChange={e => set('siteWeb', e.target.value)} />
                </div>
              </div>
              <SaveRow saving={updateMutation.isPending} saved={saved} onSave={handleSave} label="Mettre à jour" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// SUPER_ADMIN n'a pas d'organisation propre à administrer ici : ses écrans
// dédiés (console Super Admin) gèrent les organisations. Ce composant évite
// toute corruption de données (écriture sur une organisation arbitraire via
// useOrganisation()'s .limit(1) non filtré) en cas d'accès direct à cette
// section (URL, état restauré) malgré son retrait de la navigation.
function OrganisationVerrouilleeSection() {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Organisation" />
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">Section non disponible</p>
              <p className="text-sm text-muted-foreground">
                Les paramètres d'organisation globale se gèrent depuis la console Super Admin.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Section: Sauvegarde ──────────────────────────────────────────────────────

// Une vraie sauvegarde/restauration de base de données Postgres n'est pas
// déclenchable depuis le frontend avec les clés Supabase disponibles ici
// (c'est une opération d'administration de projet). À la place : un vrai
// export JSON de toutes les données de l'organisation (projets, documents,
// rapports) — réservé ADMIN puisqu'il couvre TOUTE l'organisation, pas
// seulement l'utilisateur courant.
function SauvegardeSection({ role }: { role: string }) {
  const [exporting, setExporting]     = useState(false);
  const [exportDone, setExportDone]   = useState(false);
  const [exportError, setExportError] = useState('');
  const isAdmin = role === 'ADMIN';

  async function handleExportOrg() {
    setExporting(true); setExportError('');
    try {
      const [projectsRes, documentsRes, rapportsRes] = await Promise.all([
        supabase.from('projects').select('*').is('deleted_at', null),
        supabase.from('documents_projet').select('*').is('deleted_at', null),
        supabase.from('rapports_projet').select('*').is('deleted_at', null),
      ]);
      const firstError = projectsRes.error ?? documentsRes.error ?? rapportsRes.error;
      if (firstError) throw firstError;

      const payload = {
        exporteLe: new Date().toISOString(),
        projets:   projectsRes.data,
        documents: documentsRes.data,
        rapports:  rapportsRes.data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `sigp-export-organisation-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 4000);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Erreur lors de l'export.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Sauvegarde"
        description="Une vraie sauvegarde de base de données n'est pas déclenchable depuis le frontend — à la place : ✅ un export JSON réel et complet des données de l'organisation."
      />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Exporter les données de l'organisation</CardTitle>
          <CardDescription className="text-[11px]">Projets, documents et rapports — au format JSON.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isAdmin ? (
            <p className="text-sm text-muted-foreground">Réservé aux administrateurs.</p>
          ) : (
            <>
              {exportError && <p className="text-sm text-destructive mb-3" role="alert">{exportError}</p>}
              <div className="flex items-center gap-3">
                {exportDone && <span className="text-sm text-success flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />Fichier téléchargé</span>}
                <Button variant="default" onClick={handleExportOrg} disabled={exporting} leftIcon={<Database className="h-4 w-4" />}>
                  {exporting ? 'Préparation...' : 'Exporter les données'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Section: Archivage — persisté dans prefsStore ────────────────────────────

async function countDeleted(table: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .not('deleted_at', 'is', null);
  if (error) throw error;
  return count ?? 0;
}

function useArchivedCounts() {
  return useQuery({
    queryKey: ['archived-counts'],
    queryFn: async () => {
      const [documents, projets, rapports] = await Promise.all([
        countDeleted('documents_projet'),
        countDeleted('projects'),
        countDeleted('rapports_projet'),
      ]);
      return { documents, projets, rapports, corbeille: documents + projets + rapports };
    },
  });
}

// ─── Restaurer des éléments — vraie liste + restauration réelle ──────────────

type TrashItemType = 'document' | 'projet' | 'rapport';
interface TrashItem { id: string; type: TrashItemType; titre: string; deletedAt: string | null }

const RESTORE_FUNCTION: Record<TrashItemType, string> = {
  document: 'documents-restore',
  projet:   'projects-restore',
  rapport:  'reports-restore',
};

function useTrashItems() {
  return useQuery({
    queryKey: ['trash-items'],
    queryFn: async (): Promise<TrashItem[]> => {
      const [docs, projets, rapports] = await Promise.all([
        supabase.from('documents_projet').select('id, titre, deleted_at').not('deleted_at', 'is', null),
        supabase.from('projects').select('id, nom, deleted_at').not('deleted_at', 'is', null),
        supabase.from('rapports_projet').select('id, titre, deleted_at').not('deleted_at', 'is', null),
      ]);
      const firstError = docs.error ?? projets.error ?? rapports.error;
      if (firstError) throw firstError;

      const items: TrashItem[] = [
        ...(docs.data ?? []).map(d => ({ id: d.id, type: 'document' as const, titre: d.titre, deletedAt: d.deleted_at })),
        ...(projets.data ?? []).map(p => ({ id: p.id, type: 'projet' as const, titre: p.nom, deletedAt: p.deleted_at })),
        ...(rapports.data ?? []).map(r => ({ id: r.id, type: 'rapport' as const, titre: r.titre, deletedAt: r.deleted_at })),
      ];
      return items.sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''));
    },
  });
}

function useRestoreItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: TrashItem) => {
      await invokeEdgeFunction(RESTORE_FUNCTION[item.type], { id: item.id });
      return item;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash-items'] });
      qc.invalidateQueries({ queryKey: ['archived-counts'] });
    },
  });
}

const TRASH_TYPE_LABEL: Record<TrashItemType, string> = {
  document: 'Document', projet: 'Projet', rapport: 'Rapport',
};

function ArchivageSection() {
  const { archivage, setPrefs } = usePrefsStore();
  const { data: counts, isLoading: countsLoading } = useArchivedCounts();
  const { data: trashItems = [], isLoading: trashLoading } = useTrashItems();
  const restoreMutation = useRestoreItem();
  const [viderOpen, setViderOpen] = useState(false);
  const [viderDone, setViderDone] = useState(false);
  const [restoreListOpen, setRestoreListOpen] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [saved,     setSaved]     = useState(false);

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  function setArchivageField<K extends keyof typeof archivage>(k: K, v: typeof archivage[K]) {
    setPrefs({ archivage: { ...archivage, [k]: v } });
    flash();
  }

  function handleVider() { setViderOpen(false); setViderDone(true); setTimeout(() => setViderDone(false), 4000); }

  async function handleRestoreItem(item: TrashItem) {
    setRestoreError('');
    try {
      await restoreMutation.mutateAsync(item);
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : 'Erreur lors de la restauration.');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Archivage" description="Politique d'archivage automatique. ✅ Switches persistés dans le store local." />

      {saved && (
        <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-3 py-2 border border-success/20" aria-live="polite">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Configuration enregistrée.
        </div>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-0">
            <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Archivage automatique</p>
                <p className="text-[11px] text-muted-foreground">Archiver les éléments inactifs automatiquement</p>
              </div>
              <SettingsSwitch id="arc-auto" checked={archivage.autoArchive} onChange={v => setArchivageField('autoArchive', v)} />
            </div>
            <div className="flex flex-col gap-1.5 py-3 border-b border-border">
              <label className="text-sm font-medium text-foreground" htmlFor="arc-ret">Durée de conservation</label>
              <Select id="arc-ret" value={archivage.retentionAns} onChange={e => setArchivageField('retentionAns', e.target.value)} className="max-w-xs">
                {['1','2','3','5','7','10','15','20'].map(v => <option key={v} value={v}>{v} {v === '1' ? 'an' : 'ans'}</option>)}
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Corbeille</p>
                <p className="text-[11px] text-muted-foreground">Conserver les éléments supprimés avant suppression définitive</p>
              </div>
              <SettingsSwitch id="arc-corbeille" checked={archivage.corbeille} onChange={v => setArchivageField('corbeille', v)} />
            </div>
            <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Suppression automatique de la corbeille</p>
                <p className="text-[11px] text-muted-foreground">Vider automatiquement la corbeille après le délai</p>
              </div>
              <SettingsSwitch id="arc-autodel" checked={archivage.autoDelete} onChange={v => setArchivageField('autoDelete', v)} />
            </div>
            {archivage.autoDelete && (
              <div className="flex flex-col gap-1.5 py-3">
                <label className="text-sm font-medium text-foreground" htmlFor="arc-days">Supprimer après</label>
                <Select id="arc-days" value={archivage.deleteAfterJours} onChange={e => setArchivageField('deleteAfterJours', e.target.value)} className="max-w-xs">
                  {['7','14','30','60','90'].map(v => <option key={v} value={v}>{v} jours</option>)}
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Éléments archivés</CardTitle>
          <CardDescription className="text-[11px]">✅ Compteurs réels (deleted_at renseigné, toutes suppressions sont des soft-delete).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Documents', count: counts?.documents },
              { label: 'Projets',   count: counts?.projets },
              { label: 'Rapports',  count: counts?.rapports },
              { label: 'Corbeille', count: counts?.corbeille },
            ].map(item => (
              <div key={item.label} className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{countsLoading ? '—' : item.count}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">⚠️ "Vider la corbeille" reste une simulation (purge irréversible à l'échelle de l'organisation) — "Restaurer" est réel.</p>
          <div className="flex items-center gap-3 flex-wrap">
            {viderDone && <span className="text-sm text-success flex items-center gap-1.5" aria-live="polite"><CheckCircle2 className="h-4 w-4" />Corbeille vidée (simulation)</span>}
            <Button variant="outline" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => setRestoreListOpen(true)}>
              Restaurer des éléments
            </Button>
            <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10"
              leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setViderOpen(true)}>
              Vider la corbeille
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal open={viderOpen} onOpenChange={setViderOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Vider la corbeille ?</ModalTitle>
            <ModalDescription>Les {counts?.corbeille ?? 0} éléments dans la corbeille seront supprimés définitivement (simulation — aucune suppression réelle pour l'instant).</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Annuler</Button></ModalClose>
            <Button variant="destructive" onClick={handleVider} leftIcon={<Trash2 className="h-4 w-4" />}>Vider définitivement</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={restoreListOpen} onOpenChange={o => { if (!o) { setRestoreListOpen(false); setRestoreError(''); } }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Restaurer des éléments</ModalTitle>
            <ModalDescription>Documents, projets et rapports supprimés — restauration réelle et immédiate.</ModalDescription>
          </ModalHeader>
          <div className="px-6 pb-2 max-h-[320px] overflow-y-auto">
            {restoreError && <p className="text-sm text-destructive mb-2" role="alert">{restoreError}</p>}
            {trashLoading ? (
              <p className="text-sm text-muted-foreground py-4">Chargement…</p>
            ) : trashItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">La corbeille est vide.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {trashItems.map(item => {
                  const isRestoring = restoreMutation.isPending && restoreMutation.variables?.id === item.id;
                  return (
                    <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{item.titre}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {TRASH_TYPE_LABEL[item.type]} · supprimé le {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('fr-FR') : '—'}
                        </p>
                      </div>
                      <Button
                        variant="outline" size="sm" className="shrink-0 gap-1.5"
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                        disabled={isRestoring}
                        onClick={() => handleRestoreItem(item)}
                      >
                        {isRestoring ? 'Restauration...' : 'Restaurer'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Fermer</Button></ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

// ─── Section: Confidentialité — persistée dans localStorage ──────────────────

const PRIV_KEY = 'sigp-privacy';

function loadPrivacy() {
  try {
    const raw = localStorage.getItem(PRIV_KEY);
    if (raw) return JSON.parse(raw) as { consents: Record<string, boolean>; cookies: Record<string, boolean> };
  } catch { /* ignore */ }
  return { consents: { analytics: true, marketing: false }, cookies: { prefs: true, tracking: false } };
}

function ConfidentialiteSection() {
  const [data, setData] = useState(loadPrivacy);
  const [saved, setSaved] = useState(false);

  function setConsent(k: string, v: boolean) {
    const next = { ...data, consents: { ...data.consents, [k]: v } };
    setData(next);
    localStorage.setItem(PRIV_KEY, JSON.stringify(next));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  function setCookie(k: string, v: boolean) {
    const next = { ...data, cookies: { ...data.cookies, [k]: v } };
    setData(next);
    localStorage.setItem(PRIV_KEY, JSON.stringify(next));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Confidentialité" description="Consentements et cookies. ✅ Persistés dans localStorage." />

      {saved && (
        <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-3 py-2 border border-success/20" aria-live="polite">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Préférences de confidentialité enregistrées.
        </div>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Consentements</CardTitle></CardHeader>
        <CardContent>
          {[
            { key: 'essential', label: 'Données essentielles',      desc: "Nécessaires au fonctionnement. Non désactivables.", disabled: true,  value: true },
            { key: 'analytics', label: 'Analyses et statistiques',  desc: "Amélioration de l'application.", disabled: false, value: data.consents.analytics },
            { key: 'marketing', label: 'Communications marketing',  desc: 'Nouvelles fonctionnalités et actualités.', disabled: false, value: data.consents.marketing },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-b-0">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <SettingsSwitch id={`con-${item.key}`} checked={item.value} onChange={v => !item.disabled && setConsent(item.key, v)} disabled={item.disabled} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Gestion des cookies</CardTitle></CardHeader>
        <CardContent>
          {[
            { key: 'session',  label: 'Cookies de session',    desc: 'Maintiennent votre connexion.', disabled: true,  value: true },
            { key: 'prefs',    label: 'Cookies de préférences', desc: 'Mémorisent vos préférences.', disabled: false, value: data.cookies.prefs },
            { key: 'tracking', label: 'Cookies de suivi',       desc: "Analyse du comportement utilisateur.", disabled: false, value: data.cookies.tracking },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-b-0">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <SettingsSwitch id={`ck-${item.key}`} checked={item.value} onChange={v => !item.disabled && setCookie(item.key, v)} disabled={item.disabled} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vos données personnelles</CardTitle>
          <CardDescription className="text-[11px]">Exercez vos droits (RGPD).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {[
              { icon: Download,     label: 'Télécharger mes données',        desc: 'Export JSON + CSV' },
              { icon: ExternalLink, label: 'Politique de confidentialité',   desc: 'Consulter la politique complète' },
            ].map(item => (
              <div key={item.label}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group">
                <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Section: Préférences — connectée à prefsStore ────────────────────────────

function PrefsAvanceesSection() {
  const { display, a11y, setPrefs } = usePrefsStore();
  const [saved, setSaved] = useState(false);

  function setDisplayField<K extends keyof typeof display>(k: K, v: string) {
    setPrefs({ display: { ...display, [k]: v } });
    flash();
  }

  function setA11yField<K extends keyof typeof a11y>(k: K, v: boolean | string) {
    setPrefs({ a11y: { ...a11y, [k]: v } });
    if (k === 'reduceMotion') {
      if (v) document.documentElement.classList.add('reduce-motion');
      else   document.documentElement.classList.remove('reduce-motion');
    }
    flash();
  }

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Préférences" description="Interface et accessibilité. ✅ Persistées dans le store local." />

      {saved && (
        <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-3 py-2 border border-success/20" aria-live="polite">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Préférences enregistrées.
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Interface</CardTitle>
          <CardDescription className="text-[11px]">✅ Dashboard par défaut — modifie la redirection de la route <code>/</code>.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="pf-home">Tableau de bord par défaut</label>
              <Select id="pf-home" value={display.homePage} onChange={e => setDisplayField('homePage', e.target.value)}>
                <option value="Tableau de bord">Tableau de bord</option>
                <option value="Projets">Projets</option>
                <option value="Documents">Documents</option>
                <option value="Utilisateurs">Utilisateurs</option>
                <option value="Paramètres">Paramètres</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="pf-pag">Lignes par page (tableaux)</label>
              <Select id="pf-pag" value={display.pagination} onChange={e => setDisplayField('pagination', e.target.value)}>
                {['10','15','20','25','50','100'].map(v => <option key={v} value={v}>{v} lignes</option>)}
              </Select>
            </div>
          </div>

          <div className="space-y-0">
            <div className="flex items-center justify-between gap-4 py-3 border-t border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Réduire les animations</p>
                <p className="text-[11px] text-muted-foreground">✅ Applique immédiatement la classe <code>.reduce-motion</code> sur le document.</p>
              </div>
              <SettingsSwitch id="pf-motion" checked={a11y.reduceMotion} onChange={v => setA11yField('reduceMotion', v)} />
            </div>
            <div className="flex items-center justify-between gap-4 py-3 border-t border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Contraste élevé</p>
                <p className="text-[11px] text-muted-foreground">Améliore la lisibilité pour les personnes malvoyantes.</p>
              </div>
              <SettingsSwitch id="pf-contrast" checked={a11y.highContrast} onChange={v => setA11yField('highContrast', v)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Section: Intégrations ────────────────────────────────────────────────────

interface ApiKey { id: string; nom: string; valeur: string; createdAt: string; dernierUsage: string }
interface WebhookItem { id: string; url: string; evenement: string; actif: boolean }
interface ConnectedApp { id: string; nom: string; permissions: string[]; connectedAt: string }

const MOCK_KEYS: ApiKey[] = [
  { id: 'k1', nom: 'API Production',      valeur: 'sk-sigp-prod-abc123xyz456', createdAt: '15/01/2026', dernierUsage: '04/07/2026' },
  { id: 'k2', nom: 'Webhook Integration', valeur: 'wh-sigp-hook-xyz789abc012', createdAt: '20/03/2026', dernierUsage: '28/06/2026' },
];
const MOCK_WEBHOOKS: WebhookItem[] = [
  { id: 'w1', url: 'https://hooks.example.com/sigp', evenement: 'Nouveau projet', actif: true },
  { id: 'w2', url: 'https://api.partner.org/notify', evenement: 'Validation',      actif: false },
];
const MOCK_APPS: ConnectedApp[] = [
  { id: 'a1', nom: 'Microsoft Teams', permissions: ['Notifications', 'Rapports'], connectedAt: '01/02/2026' },
  { id: 'a2', nom: 'Google Drive',    permissions: ['Documents'],                 connectedAt: '15/03/2026' },
];

function IntegrationsSection() {
  const [keys,    setKeys]    = useState<ApiKey[]>(MOCK_KEYS);
  const [hooks,   setHooks]   = useState<WebhookItem[]>(MOCK_WEBHOOKS);
  const [apps,    setApps]    = useState<ConnectedApp[]>(MOCK_APPS);
  const [shown,   setShown]   = useState<Record<string, boolean>>({});
  const [copied,  setCopied]  = useState<string | null>(null);
  const [revokeTarget,     setRevokeTarget]     = useState<ApiKey | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<ConnectedApp | null>(null);

  function handleCopy(k: ApiKey) { setCopied(k.id); setTimeout(() => setCopied(null), 2000); }
  function handleRevoke()        { if (!revokeTarget) return; setKeys(prev => prev.filter(k => k.id !== revokeTarget.id)); setRevokeTarget(null); }
  function handleDisconnect()    { if (!disconnectTarget) return; setApps(prev => prev.filter(a => a.id !== disconnectTarget.id)); setDisconnectTarget(null); }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Intégrations" description="API, webhooks et applications. ⚠️ Simulation — nécessite le backend." />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Clés API</CardTitle>
            <Button size="sm" variant="outline" className="h-8 text-xs">Créer une clé</Button>
          </div>
        </CardHeader>
        <CardContent>
          {keys.length === 0
            ? <p className="text-sm text-muted-foreground">Aucune clé API.</p>
            : (
              <div className="flex flex-col gap-3">
                {keys.map(k => (
                  <div key={k.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm font-semibold text-foreground">{k.nom}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => setShown(s => ({ ...s, [k.id]: !s[k.id] }))} aria-label="Afficher/masquer">
                          {shown[k.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(k)} aria-label="Copier">
                          {copied === k.id ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setRevokeTarget(k)} aria-label="Révoquer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="font-mono text-[11px] bg-muted rounded px-2 py-1.5 text-muted-foreground select-all">
                      {shown[k.id] ? k.valeur : `${k.valeur.slice(0, 12)}${'•'.repeat(16)}`}
                    </div>
                    <div className="flex gap-4 mt-2">
                      <span className="text-[10px] text-muted-foreground">Créée le {k.createdAt}</span>
                      <span className="text-[10px] text-muted-foreground">Dernier usage {k.dernierUsage}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Webhooks</CardTitle>
            <Button size="sm" variant="outline" className="h-8 text-xs">Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {hooks.map(w => (
              <div key={w.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-[12px] font-mono text-foreground truncate">{w.url}</p>
                  <p className="text-[10px] text-muted-foreground">Événement : <strong>{w.evenement}</strong></p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={w.actif ? 'success' : 'secondary'} className="text-[10px]">{w.actif ? 'Actif' : 'Inactif'}</Badge>
                  <SettingsSwitch id={`wh-${w.id}`} checked={w.actif} onChange={v => setHooks(prev => prev.map(h => h.id === w.id ? { ...h, actif: v } : h))} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Applications connectées</CardTitle></CardHeader>
        <CardContent>
          {apps.length === 0
            ? <p className="text-sm text-muted-foreground">Aucune application connectée.</p>
            : (
              <div className="flex flex-col gap-3">
                {apps.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold text-foreground">{a.nom}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {a.permissions.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                      onClick={() => setDisconnectTarget(a)}>
                      Déconnecter
                    </Button>
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>

      <Modal open={!!revokeTarget} onOpenChange={o => { if (!o) setRevokeTarget(null); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Révoquer la clé API ?</ModalTitle>
            <ModalDescription>La clé <strong>{revokeTarget?.nom}</strong> sera révoquée définitivement.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Annuler</Button></ModalClose>
            <Button variant="destructive" onClick={handleRevoke} leftIcon={<Trash2 className="h-4 w-4" />}>Révoquer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={!!disconnectTarget} onOpenChange={o => { if (!o) setDisconnectTarget(null); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Déconnecter l'application ?</ModalTitle>
            <ModalDescription>L'accès de <strong>{disconnectTarget?.nom}</strong> à SIGP sera révoqué.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Annuler</Button></ModalClose>
            <Button variant="destructive" onClick={handleDisconnect}>Déconnecter</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

// ─── Section: À propos ────────────────────────────────────────────────────────

const CHANGELOG = [
  { version: '2.4.1', date: '04/07/2026', notes: 'Module Paramètres — centre de configuration fonctionnel (thème, notifs, prefs persistées).' },
  { version: '2.4.0', date: '03/07/2026', notes: 'Module Documents globaux — bibliothèque documentaire.' },
  { version: '2.3.0', date: '01/07/2026', notes: 'Module Commentaires et Paramètres projet.' },
  { version: '2.2.0', date: '25/06/2026', notes: 'Historique, Gouvernance, Sources de financement.' },
  { version: '2.1.0', date: '15/06/2026', notes: 'EVM, Risques, Livrables, Rapports.' },
  { version: '2.0.0', date: '01/06/2026', notes: 'Refonte complète du design system.' },
];

function AProposSection() {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="À propos" description="Version, composants et historique des mises à jour." />
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Version de la plateforme</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Version SIGP',    value: '2.4.1',        variant: 'success'    as const },
              { label: 'Frontend',        value: '0.0.0',        variant: 'default'    as const },
              { label: 'Backend',         value: '1.8.3',        variant: 'default'    as const },
              { label: 'Date de build',   value: '04/07/2026',   variant: 'default'    as const },
              { label: 'Environnement',   value: 'Production',   variant: 'info'       as const },
              { label: 'Licence',         value: 'SIGP Enterprise', variant: 'secondary' as const },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card">
                <span className="text-[12px] text-muted-foreground font-medium">{item.label}</span>
                <Badge variant={item.variant} className="text-[11px] font-mono">{item.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Historique des versions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-border">
            {CHANGELOG.map((entry, i) => (
              <div key={entry.version} className="flex items-start gap-3 py-3">
                <Badge variant={i === 0 ? 'success' : 'outline'} className="text-[11px] font-mono shrink-0 mt-0.5">v{entry.version}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground">{entry.notes}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{entry.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Stack technique</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            React 18 · TypeScript 5 · Vite 8 · Zustand (persist) · TanStack Table · Recharts · Radix UI · Tailwind CSS
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Section: Zone dangereuse — reset prefsStore ──────────────────────────────

interface ZoneDangereuseProps {
  profile: UserProfile;
  onResetAll: () => void;
  onTerminateAllSessions: () => Promise<void>;
}

function ZoneDangereuse({ profile, onResetAll, onTerminateAllSessions }: ZoneDangereuseProps) {
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateProfile();
  const deleteUserMutation    = useDeleteUser();

  const [resetOpen,      setResetOpen]      = useState(false);
  const [sessionsOpen,   setSessionsOpen]   = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen,     setDeleteOpen]     = useState(false);
  const [deleteConfirm,  setDeleteConfirm]  = useState('');
  const [resetDone,    setResetDone]    = useState(false);
  const [sessionsDone, setSessionsDone] = useState(false);
  const [exportDone,   setExportDone]   = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState('');

  const prefs = usePrefsStore();
  const { data: history = [], isLoading: historyLoading } = useLoginHistory(profile.id);

  function handleReset() {
    onResetAll(); setResetOpen(false); setResetDone(true);
    setTimeout(() => setResetDone(false), 4000);
  }

  async function handleTerminateAll() {
    await onTerminateAllSessions(); setSessionsOpen(false); setSessionsDone(true);
    setTimeout(() => setSessionsDone(false), 4000);
  }

  async function handleDeactivate() {
    setDeactivating(true); setDeactivateError('');
    try {
      await updateProfileMutation.mutateAsync({ id: profile.id, actif: false });
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      setDeactivating(false);
      setDeactivateError(err instanceof Error ? err.message : 'Erreur lors de la désactivation.');
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true); setDeleteError('');
    try {
      await deleteUserMutation.mutateAsync(profile.id);
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleting(false);
      setDeleteError(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    }
  }

  function handleExport() {
    setExporting(true);
    const payload = {
      exporteLe: new Date().toISOString(),
      profil: profile,
      preferences: {
        theme: prefs.theme, region: prefs.region, display: prefs.display,
        a11y: prefs.a11y, archivage: prefs.archivage, notifs: prefs.notifs,
      },
      historiqueConnexions: history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `sigp-mes-donnees-${profile.id}.json`; a.click();
    URL.revokeObjectURL(url);
    setExporting(false); setExportDone(true);
    setTimeout(() => setExportDone(false), 4000);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Zone dangereuse" description="Actions irréversibles sur votre compte et vos données." />

      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3" role="alert">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-destructive">Les actions ci-dessous sont potentiellement irréversibles. Procédez avec prudence.</p>
      </div>

      {/* Export */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0"><Download className="h-3.5 w-3.5" /></div>
            <div>
              <CardTitle className="text-base">Exporter toutes mes données</CardTitle>
              <CardDescription className="text-[11px]">✅ Fonctionnel — export JSON réel (profil, préférences, historique de connexions).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {exportDone && <span className="text-sm text-success flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />Fichier téléchargé</span>}
            <Button variant="default" onClick={handleExport} disabled={exporting || historyLoading} leftIcon={<Download className="h-4 w-4" />}>
              {exporting ? 'Préparation...' : 'Exporter mes données'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Réinitialiser */}
      <Card className="border-warning/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-warning/10 text-warning flex items-center justify-center shrink-0"><RotateCcw className="h-3.5 w-3.5" /></div>
            <div>
              <CardTitle className="text-base">Réinitialiser tous les paramètres</CardTitle>
              <CardDescription className="text-[11px]">✅ Fonctionnel — réinitialise le store Zustand et localStorage.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {resetDone && <span className="text-sm text-success flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />Réinitialisé</span>}
            <Button variant="outline" className="border-warning/40 text-warning hover:bg-warning/10"
              onClick={() => setResetOpen(true)} leftIcon={<RotateCcw className="h-4 w-4" />}>
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Déconnecter tout */}
      <Card className="border-warning/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-warning/10 text-warning flex items-center justify-center shrink-0"><LogOut className="h-3.5 w-3.5" /></div>
            <div>
              <CardTitle className="text-base">Déconnecter les autres appareils</CardTitle>
              <CardDescription className="text-[11px]">✅ Fonctionnel — révoque les sessions actives sur tous les autres appareils.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {sessionsDone && <span className="text-sm text-success flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />Sessions terminées</span>}
            <Button variant="outline" className="border-warning/40 text-warning hover:bg-warning/10"
              onClick={() => setSessionsOpen(true)} leftIcon={<LogOut className="h-4 w-4" />}>
              Tout déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Désactiver */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0"><UserX className="h-3.5 w-3.5" /></div>
            <div>
              <CardTitle className="text-base text-destructive">Désactiver mon compte</CardTitle>
              <CardDescription className="text-[11px]">✅ Fonctionnel — vous déconnecte immédiatement ; seul un ADMIN peut réactiver le compte.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeactivateOpen(true)} leftIcon={<UserX className="h-4 w-4" />}>Désactiver</Button>
        </CardContent>
      </Card>

      {/* Supprimer */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-destructive/20 text-destructive flex items-center justify-center shrink-0"><Trash2 className="h-3.5 w-3.5" /></div>
            <div>
              <CardTitle className="text-base text-destructive">Supprimer définitivement mon compte</CardTitle>
              <CardDescription className="text-[11px]">✅ Fonctionnel — suppression (soft-delete, comme partout dans l'app) + déconnexion immédiate.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} leftIcon={<Trash2 className="h-4 w-4" />}>Supprimer</Button>
        </CardContent>
      </Card>

      {/* Modals */}
      <Modal open={resetOpen} onOpenChange={setResetOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Réinitialiser tous les paramètres ?</ModalTitle>
            <ModalDescription>Thème, langue, notifications, préférences — tout sera remis aux valeurs par défaut. L'action est immédiate et persistée.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Annuler</Button></ModalClose>
            <Button variant="outline" className="border-warning/40 text-warning hover:bg-warning/10" onClick={handleReset} leftIcon={<RotateCcw className="h-4 w-4" />}>
              Réinitialiser
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={sessionsOpen} onOpenChange={setSessionsOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Déconnecter tous les appareils ?</ModalTitle>
            <ModalDescription>Tous les appareils connectés sauf la session courante seront déconnectés.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Annuler</Button></ModalClose>
            <Button variant="destructive" onClick={handleTerminateAll} leftIcon={<LogOut className="h-4 w-4" />}>Tout déconnecter</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={deactivateOpen} onOpenChange={o => { if (!o) { setDeactivateOpen(false); setDeactivateError(''); } }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Désactiver le compte ?</ModalTitle>
            <ModalDescription>
              Votre compte sera suspendu et vous serez déconnecté immédiatement. Vos données sont
              conservées — seul un administrateur peut réactiver le compte ensuite.
            </ModalDescription>
          </ModalHeader>
          {deactivateError && <p className="px-6 pb-2 text-sm text-destructive" role="alert">{deactivateError}</p>}
          <ModalFooter>
            <ModalClose asChild><Button variant="outline" disabled={deactivating}>Annuler</Button></ModalClose>
            <Button variant="destructive" onClick={handleDeactivate} disabled={deactivating} leftIcon={<UserX className="h-4 w-4" />}>
              {deactivating ? 'Désactivation...' : 'Désactiver'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={deleteOpen} onOpenChange={o => { if (!o) { setDeleteOpen(false); setDeleteConfirm(''); setDeleteError(''); } }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer définitivement le compte ?</ModalTitle>
            <ModalDescription>Votre compte sera supprimé et vous serez déconnecté immédiatement. Tapez <strong>SUPPRIMER</strong> pour confirmer.</ModalDescription>
          </ModalHeader>
          <div className="px-6 pb-2">
            <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="SUPPRIMER" className="font-mono" />
          </div>
          {deleteError && <p className="px-6 pb-2 text-sm text-destructive" role="alert">{deleteError}</p>}
          <ModalFooter>
            <ModalClose asChild><Button variant="outline" disabled={deleting} onClick={() => setDeleteConfirm('')}>Annuler</Button></ModalClose>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirm !== 'SUPPRIMER' || deleting} leftIcon={<Trash2 className="h-4 w-4" />}>
              {deleting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  profile: UserProfile;
  navGroups: typeof NAV_GROUPS;
  current: SectionId;
  onSelect: (id: SectionId) => void;
}

function SettingsSidebar({ profile, navGroups, current, onSelect }: SidebarProps) {
  const avatarStyle = userAvatarStyle(profile.initiales);
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex-col hidden lg:flex" aria-label="Navigation des paramètres">
      <div className="p-4 border-b border-border flex items-center gap-3 min-w-0">
        <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 select-none', avatarStyle)}>
          {profile.initiales}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{profile.prenom} {profile.nom}</span>
          <span className="text-[10px] text-muted-foreground truncate">{profile.poste}</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Sections des paramètres">
        {navGroups.map(group => (
          <div key={group.group} className="mb-1">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{group.group}</p>
            {group.items.map(item => {
              const Icon = item.icon;
              const active = current === item.id;
              return (
                <button key={item.id} onClick={() => onSelect(item.id)} aria-current={active ? 'page' : undefined}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-md mx-1 text-left transition-colors text-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                    active && !item.danger && 'bg-primary/10 text-primary font-medium',
                    active &&  item.danger && 'bg-destructive/10 text-destructive font-medium',
                    !active && !item.danger && 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    !active &&  item.danger && 'text-destructive/70 hover:bg-destructive/10 hover:text-destructive',
                  )}>
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [current,  setCurrent]  = useState<SectionId>('compte');
  const backendProfile            = useCurrentUserProfile();
  const updateProfileMutation     = useUpdateProfile();
  const [profile,  setProfile]  = useState<UserProfile>(backendProfile);

  useEffect(() => {
    if (backendProfile.id) setProfile(backendProfile);
  }, [backendProfile.id]);

  const { setTheme, setPrefs, setNotifs } = usePrefsStore();

  // Un SUPER_ADMIN n'a pas d'organisation "à lui" à modifier ici — la section
  // est retirée de la navigation (et bloquée en cas d'accès direct) pour
  // éviter d'écrire sur une organisation arbitraire (cf. useOrganisation()).
  const isSuperAdmin = profile.role === 'SUPER_ADMIN';
  const visibleNavGroups = isSuperAdmin
    ? NAV_GROUPS.map(group =>
        group.group === 'Plateforme'
          ? { ...group, items: group.items.filter(item => item.id !== 'organisation') }
          : group,
      )
    : NAV_GROUPS;

  async function handleTerminateOthers() {
    await supabase.auth.signOut({ scope: 'others' });
  }

  function handleResetAll() {
    // Réinitialise le store Zustand (et donc localStorage via persist)
    setTheme('dark');
    setPrefs({
      region:  { lang: 'fr', timezone: 'UTC+0 - Abidjan', dateFormat: 'JJ/MM/AAAA', timeFormat: '24h', currency: 'XOF (Franc CFA)', numberFormat: '1 234 567,89' },
      display: { homePage: 'Tableau de bord', density: 'Confortable', pagination: '25' },
      a11y:    { reduceMotion: false, highContrast: false, textSize: 'Standard' },
      archivage: { autoArchive: true, corbeille: true, autoDelete: false, retentionAns: '10', deleteAfterJours: '30' },
    });
    setNotifs({
      channels:  { email: true, push: true, sms: false },
      emailFreq: 'Immédiat',
      alerts: {
        budget:      { enabled: true,  threshold: '5%', channels: { email: true,  push: true  }, frequency: 'Immédiat'     },
        tresorerie:  { enabled: true,                   channels: { email: true,  push: false }, frequency: 'Immédiat'     },
        validations: { enabled: true,                   channels: { email: true,  push: true  }, frequency: 'Quotidien'    },
        rapports:    { enabled: false,                  channels: { email: true,  push: false }, frequency: 'Hebdomadaire' },
        risques:     { enabled: true,                   channels: { email: true,  push: true  }, frequency: 'Immédiat'     },
        echeances:   { enabled: false,                  channels: { email: false, push: false }, frequency: 'Quotidien'    },
        mentions:    { enabled: true,                   channels: { email: false, push: true  }, frequency: 'Immédiat'     },
      },
      dnd: { enabled: false, start: '21:00', end: '08:00', days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'] },
    });
    applyThemeClass('dark');
    document.documentElement.classList.remove('reduce-motion');
    // Nettoie aussi les préférences de confidentialité
    localStorage.removeItem('sigp-privacy');
  }

  function handleSaveProfile(p: UserProfile) {
    setProfile(p);
    if (p.id) {
      updateProfileMutation.mutate({
        id: p.id, prenom: p.prenom, nom: p.nom,
        telephone: p.telephone || undefined,
        poste: p.poste || undefined, bio: p.bio || undefined,
      });
    }
  }

  function renderSection(): React.ReactNode {
    switch (current) {
      case 'compte':
        return <MonCompteSection profile={profile} onSave={handleSaveProfile} />;
      case 'securite':
        return (
          <SecuriteSection
            userId={profile.id}
            onTerminateOthers={handleTerminateOthers}
          />
        );
      case 'notifications':
        return <NotificationsSection />;
      case 'apparence':
        return <ApparenceSection />;
      case 'organisation':
        return isSuperAdmin ? <OrganisationVerrouilleeSection /> : <OrgSection role={profile.role} />;
      case 'sauvegarde':
        return <SauvegardeSection role={profile.role} />;
      case 'archivage':
        return <ArchivageSection />;
      case 'confidentialite':
        return <ConfidentialiteSection />;
      case 'preferences':
        return <PrefsAvanceesSection />;
      case 'integrations':
        return <IntegrationsSection />;
      case 'apropos':
        return <AProposSection />;
      case 'danger':
        return (
          <ZoneDangereuse
            profile={profile}
            onResetAll={handleResetAll}
            onTerminateAllSessions={handleTerminateOthers}
          />
        );
    }
  }

  const allItems = visibleNavGroups.flatMap(g => g.items);

  return (
    <div className="flex min-h-full bg-background">
      <SettingsSidebar profile={profile} navGroups={visibleNavGroups} current={current} onSelect={setCurrent} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sélecteur mobile */}
        <div className="lg:hidden border-b border-border px-4 py-2">
          <Select value={current} onChange={e => setCurrent(e.target.value as SectionId)} aria-label="Section des paramètres">
            {visibleNavGroups.map(group => (
              <optgroup key={group.group} label={group.group}>
                {group.items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
              </optgroup>
            ))}
          </Select>
        </div>

        {/* Fil d'Ariane */}
        <div className="hidden lg:flex items-center gap-2 px-6 pt-4 pb-0 text-[11px] text-muted-foreground" aria-label="Fil d'Ariane">
          <span>Paramètres</span>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <span className="text-foreground font-medium">
            {allItems.find(i => i.id === current)?.label ?? ''}
          </span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-20">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
