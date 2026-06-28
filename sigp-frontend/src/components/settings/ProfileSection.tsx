import { useState, useEffect } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import { userAvatarStyle } from '@/components/users/userAvatarStyle';
import type { UserProfile } from '@/mocks/settingsMocks';

interface ProfileSectionProps {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
}

export function ProfileSection({ profile, onSave }: ProfileSectionProps) {
  const [form, setForm] = useState<UserProfile>({ ...profile });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm({ ...profile }); }, [profile]);

  const avatarStyle = userAvatarStyle(profile.initiales);

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      onSave(form);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar + Identity */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div
              className={cn(
                'h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 select-none',
                avatarStyle
              )}
              aria-label={`Avatar de ${profile.prenom} ${profile.nom}`}
            >
              {profile.initiales}
            </div>
            <div className="flex flex-col gap-1.5 text-center sm:text-left">
              <h2 className="text-xl font-semibold text-foreground">
                {profile.prenom} {profile.nom}
              </h2>
              <p className="text-sm text-muted-foreground">{profile.poste}</p>
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start mt-0.5">
                <Badge variant="secondary">{profile.roleLabel}</Badge>
                <Badge variant={profile.actif ? 'success' : 'destructive'}>
                  {profile.actif ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Inscrit le {profile.dateInscription} · Dernière connexion {profile.dernierAcces}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="prf-prenom">
                Prénom
              </label>
              <Input
                id="prf-prenom"
                value={form.prenom}
                onChange={(e) => set('prenom', e.target.value)}
                placeholder="Votre prénom"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="prf-nom">
                Nom
              </label>
              <Input
                id="prf-nom"
                value={form.nom}
                onChange={(e) => set('nom', e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="prf-email">
                Email professionnel
              </label>
              <Input
                id="prf-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="email@organisation.org"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="prf-tel">
                Téléphone
              </label>
              <Input
                id="prf-tel"
                type="tel"
                value={form.telephone}
                onChange={(e) => set('telephone', e.target.value)}
                placeholder="+XXX XX XXX XX XX"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="prf-poste">
                Poste / Fonction
              </label>
              <Input
                id="prf-poste"
                value={form.poste}
                onChange={(e) => set('poste', e.target.value)}
                placeholder="Votre poste"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="prf-bio">
                Bio
              </label>
              <Textarea
                id="prf-bio"
                rows={3}
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Décrivez votre expertise et vos responsabilités..."
                className="resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Organisation
              </label>
              <div className="flex items-center h-9 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground select-none">
                {profile.organisation}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Rôle (non modifiable)
              </label>
              <div className="flex items-center h-9 rounded-md border border-border bg-muted/50 px-3">
                <Badge variant="secondary" className="text-xs">{profile.roleLabel}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Projets affectés
            <span className="ml-2 text-[11px] font-normal text-muted-foreground">
              ({profile.projetsAffecter.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.projetsAffecter.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun projet affecté.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.projetsAffecter.map((p) => (
                <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success" aria-live="polite">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Modifications enregistrées
          </span>
        )}
        <Button
          variant="default"
          onClick={handleSave}
          disabled={saving}
          leftIcon={<Save className="h-4 w-4" />}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}
