import { useState } from 'react';
import { CheckCircle2, AlertCircle, Laptop, Smartphone, Tablet, Shield, Key, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/Card';
import { SettingsSwitch } from '@/components/settings/SettingsSwitch';
import type { ActiveSession, ConnectionHistory, SessionDevice } from '@/mocks/settingsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Device icon helper
// ─────────────────────────────────────────────────────────────────────────────

function DeviceIcon({ device }: { device: SessionDevice }) {
  const cls = 'h-4 w-4';
  switch (device) {
    case 'mobile':  return <Smartphone className={cls} aria-hidden="true" />;
    case 'tablet':  return <Tablet className={cls} aria-hidden="true" />;
    case 'desktop': return <Laptop className={cls} aria-hidden="true" />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SecuritySection
// ─────────────────────────────────────────────────────────────────────────────

interface SecuritySectionProps {
  twoFactor: boolean;
  onTwoFactorChange: (enabled: boolean) => void;
  sessions: ActiveSession[];
  onTerminateSession: (id: string) => void;
  connectionHistory: ConnectionHistory[];
}

export function SecuritySection({
  twoFactor,
  onTwoFactorChange,
  sessions,
  onTerminateSession,
  connectionHistory,
}: SecuritySectionProps) {
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  function handlePasswordChange() {
    if (!pwForm.current) { setPwError('Mot de passe actuel requis.'); return; }
    if (pwForm.next.length < 8) { setPwError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Les mots de passe ne correspondent pas.'); return; }
    setPwError('');
    setPwSaving(true);
    setTimeout(() => {
      setPwSaving(false);
      setPwDone(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwDone(false), 4000);
    }, 1200);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Password change */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-warning/10 text-warning flex items-center justify-center shrink-0" aria-hidden="true">
              <Key className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Changer le mot de passe</CardTitle>
              <CardDescription className="text-[11px]">Votre mot de passe doit contenir au moins 8 caractères.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pwDone ? (
            <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-4 py-3 border border-success/20" aria-live="polite">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Mot de passe modifié avec succès.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="sec-pw-current">
                    Mot de passe actuel
                  </label>
                  <Input
                    id="sec-pw-current"
                    type="password"
                    value={pwForm.current}
                    onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                    autoComplete="current-password"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="sec-pw-new">
                    Nouveau mot de passe
                  </label>
                  <Input
                    id="sec-pw-new"
                    type="password"
                    value={pwForm.next}
                    onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="sec-pw-confirm">
                    Confirmer
                  </label>
                  <Input
                    id="sec-pw-confirm"
                    type="password"
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {pwError && (
                <div className="flex items-center gap-1.5 text-sm text-destructive" aria-live="polite">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {pwError}
                </div>
              )}
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
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden="true">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Authentification à deux facteurs (2FA)</CardTitle>
              <CardDescription className="text-[11px]">Ajoutez une couche de sécurité supplémentaire à votre compte.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">Activer l'authentification 2FA</p>
              <p className="text-[11px] text-muted-foreground">
                {twoFactor
                  ? 'La 2FA est active. Scannez le QR code avec votre application d\'authentification.'
                  : 'Protégez votre compte avec une application d\'authentification (Google Authenticator, Authy...).'}
              </p>
            </div>
            <SettingsSwitch id="sec-2fa" checked={twoFactor} onChange={onTwoFactorChange} />
          </div>

          {twoFactor && (
            <div className="flex flex-col items-center gap-3 border border-border rounded-lg p-5 bg-muted/20">
              {/* QR code placeholder */}
              <div
                className="h-32 w-32 border-2 border-border rounded-md bg-background grid grid-cols-5 gap-0.5 p-2"
                role="img"
                aria-label="QR code simulé pour la configuration 2FA"
              >
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={i % 3 === 0 || i % 7 === 0 ? 'bg-foreground rounded-sm' : 'bg-transparent'}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground text-center">Scannez ce QR code avec votre application 2FA</p>
              <div className="flex flex-col gap-1 items-center">
                <p className="text-[10px] text-muted-foreground">Code de configuration manuel</p>
                <code className="font-mono text-[12px] bg-muted px-2 py-0.5 rounded text-foreground">
                  JBSWY3DPEHPK3PXP
                </code>
              </div>
              <Badge variant="success" className="text-xs">2FA activée</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active sessions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-info/10 text-info flex items-center justify-center shrink-0" aria-hidden="true">
              <Laptop className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Sessions actives</CardTitle>
              <CardDescription className="text-[11px]">
                {sessions.length} appareil{sessions.length > 1 ? 's' : ''} connecté{sessions.length > 1 ? 's' : ''} à votre compte.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                    <DeviceIcon device={session.device} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-semibold text-foreground">{session.appareil}</span>
                      {session.courante && <Badge variant="success" className="text-[10px] px-1.5 py-0">Courante</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {session.navigateur} · {session.localisation} · {session.ip}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{session.dernierAcces}</p>
                  </div>
                </div>
                {!session.courante && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                    leftIcon={<LogOut className="h-3.5 w-3.5" />}
                    onClick={() => onTerminateSession(session.id)}
                    aria-label={`Terminer la session sur ${session.appareil}`}
                  >
                    Terminer
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique des connexions</CardTitle>
          <CardDescription className="text-[11px]">6 dernières tentatives de connexion.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-border">
            {connectionHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-[12px] font-medium text-foreground">{entry.localisation}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{entry.ip} · {entry.navigateur}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground font-mono">{entry.date}</span>
                  <Badge
                    variant={entry.statut === 'Succès' ? 'success' : 'destructive'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {entry.statut}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
