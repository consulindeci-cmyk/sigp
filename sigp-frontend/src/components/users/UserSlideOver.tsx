import { X, Mail, Phone, Briefcase, CalendarDays, Clock, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Badge } from '@/components/ui/data-display/Badge';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import {
  ROLE_LABELS,
  PERMISSION_LABELS,
  type MockUser,
  type UserRole,
  type UserStatus,
} from '@/mocks/usersMocks';
import { userAvatarStyle } from '@/components/users/userAvatarStyle';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserSlideOverMode = 'view' | 'edit' | 'new';

export interface UserSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MockUser | null;
  mode: UserSlideOverMode;
  onSave?: (data: Partial<MockUser>) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statusVariant(s: UserStatus): 'success' | 'destructive' | 'default' | 'warning' {
  switch (s) {
    case 'Actif':       return 'success';
    case 'Inactif':     return 'destructive';
    case 'Suspendu':    return 'warning';
    case 'En attente':  return 'default';
  }
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground shrink-0" aria-hidden="true">{icon}</div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-[13px] text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// View mode
// ─────────────────────────────────────────────────────────────────────────────

function UserViewContent({ user }: { user: MockUser }) {
  const avatarStyle = userAvatarStyle(user.initiales);
  const permEntries = Object.entries(PERMISSION_LABELS) as [keyof typeof PERMISSION_LABELS, string][];

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar + identité */}
      <div className="flex items-center gap-4">
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${avatarStyle}`}
          aria-hidden="true"
        >
          {user.initiales}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[16px] font-semibold text-foreground truncate">{user.prenom} {user.nom}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={statusVariant(user.statut)} className="text-[10px]">{user.statut}</Badge>
            <Badge variant="outline" className="text-[10px]">{user.roleLabel}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">{user.fonction}</p>
        </div>
      </div>

      {/* Coordonnées */}
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={user.email} />
        <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Téléphone" value={user.telephone} />
        <InfoRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Fonction" value={user.fonction} />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
        <InfoRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Date création" value={user.createdAt} />
        <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label="Dernière connexion" value={user.lastConnexion} />
      </div>

      {/* Projets affectés */}
      {user.projetsAffecter.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Projets affectés ({user.projetsAffecter.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {user.projetsAffecter.map((nom) => (
              <div key={nom} className="flex items-center gap-1.5 text-[12px] text-foreground bg-muted/40 rounded-md px-2.5 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                {nom}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions */}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Permissions</p>
        <div className="grid grid-cols-2 gap-1.5">
          {permEntries.map(([key, label]) => (
            <div
              key={key}
              className={`flex items-center gap-1.5 text-[11px] rounded-md px-2 py-1 ${user.permissions[key] ? 'bg-success/10 text-success' : 'bg-muted/30 text-muted-foreground line-through'}`}
            >
              <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${user.permissions[key] ? 'bg-success' : 'bg-muted-foreground'}`} aria-hidden="true" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form mode (edit / new)
// ─────────────────────────────────────────────────────────────────────────────

function UserFormContent({ user }: { user: MockUser | null }) {
  const roles: { value: UserRole; label: string }[] = (Object.keys(ROLE_LABELS) as UserRole[]).map((k) => ({ value: k, label: ROLE_LABELS[k] }));
  const statuts: UserStatus[] = ['Actif', 'Inactif', 'En attente', 'Suspendu'];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="u-prenom">Prénom</label>
        <Input id="u-prenom" defaultValue={user?.prenom ?? ''} placeholder="Prénom" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="u-nom">Nom</label>
        <Input id="u-nom" defaultValue={user?.nom ?? ''} placeholder="Nom de famille" />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-foreground" htmlFor="u-email">Adresse email</label>
        <Input id="u-email" type="email" defaultValue={user?.email ?? ''} placeholder="prenom.nom@organisation.ne" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="u-tel">Téléphone</label>
        <Input id="u-tel" type="tel" defaultValue={user?.telephone ?? ''} placeholder="+227 90 XX XX XX" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="u-statut">Statut</label>
        <Select id="u-statut" defaultValue={user?.statut ?? 'En attente'}>
          {statuts.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-foreground" htmlFor="u-role">Rôle</label>
        <Select id="u-role" defaultValue={user?.role ?? 'OBSERVATEUR'}>
          {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-foreground" htmlFor="u-fonction">Fonction</label>
        <Input id="u-fonction" defaultValue={user?.fonction ?? ''} placeholder="Intitulé du poste" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function UserSlideOver({ open, onOpenChange, user, mode, onSave }: UserSlideOverProps) {
  const titles: Record<UserSlideOverMode, string> = {
    view: 'Profil utilisateur',
    edit: 'Modifier l\'utilisateur',
    new:  'Nouvel utilisateur',
  };
  const readOnly = mode === 'view';

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent className="sm:max-w-md">
        <SlideOverHeader>
          <SlideOverTitle>{titles[mode]}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          {readOnly && user ? (
            <UserViewContent user={user} />
          ) : (
            <UserFormContent user={user} />
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <SlideOverClose asChild>
              <Button variant="default" onClick={() => onSave?.({})}>
                {mode === 'edit' ? 'Enregistrer' : 'Créer l\'utilisateur'}
              </Button>
            </SlideOverClose>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
