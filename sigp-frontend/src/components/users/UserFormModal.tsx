import React, { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, CalendarDays, Clock, Shield, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Badge } from '@/components/ui/data-display/Badge';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from '@/components/ui/overlays/Modal';
import { useAuthStore } from '@/stores/authStore';
import { useOrganisationsList } from '@/hooks/useOrganisationsAdmin';
import {
  USER_ROLE_OPTIONS,
  USER_ROLE_LABELS,
  type UserRow,
  type UserRole,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/lib/userAdapter';
import { userAvatarStyle } from '@/components/users/userAvatarStyle';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserFormModalMode = 'view' | 'edit' | 'new';

export interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow | null;
  mode: UserFormModalMode;
  onSaveCreate?: (data: CreateUserPayload) => void;
  onSaveUpdate?: (data: UpdateUserPayload) => void;
  isSaving?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas (Zod) — 100% Aligned with NestJS DTOs
// ─────────────────────────────────────────────────────────────────────────────

// Création par un ADMIN (org_admin) — rôle libre parmi les 6 rôles métier,
// implicitement rattaché à sa propre organisation (pas de champ organisation).
export const createUserSchema = z.object({
  nom: z.string().trim().min(1, 'Le nom est obligatoire').max(100, 'Maximum 100 caractères'),
  prenom: z.string().trim().min(1, 'Le prénom est obligatoire').max(100, 'Maximum 100 caractères'),
  email: z
    .string()
    .trim()
    .min(1, "L'adresse email est obligatoire")
    .email('Adresse email invalide')
    .max(255, 'Maximum 255 caractères'),
  telephone: z.string().trim().max(30, 'Maximum 30 caractères').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'AUDITEUR', 'VIEWER']),
  actif: z.boolean().default(true),
});

// Création par un SUPER_ADMIN — le seul rôle qu'il peut provisionner est
// ADMIN (administrateur d'organisation), obligatoirement rattaché à une
// organisation existante. Ne gère jamais les utilisateurs métier des
// organisations (COORDINATEUR/FINANCIER/etc.), délégué aux org_admin.
export const createUserSuperAdminSchema = z.object({
  nom: z.string().trim().min(1, 'Le nom est obligatoire').max(100, 'Maximum 100 caractères'),
  prenom: z.string().trim().min(1, 'Le prénom est obligatoire').max(100, 'Maximum 100 caractères'),
  email: z
    .string()
    .trim()
    .min(1, "L'adresse email est obligatoire")
    .email('Adresse email invalide')
    .max(255, 'Maximum 255 caractères'),
  telephone: z.string().trim().max(30, 'Maximum 30 caractères').optional().or(z.literal('')),
  role: z.literal('ADMIN'),
  organisationId: z.string().trim().min(1, "L'organisation de rattachement est obligatoire"),
  actif: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  nom: z.string().trim().min(1, 'Le nom est obligatoire').max(100, 'Maximum 100 caractères'),
  prenom: z.string().trim().min(1, 'Le prénom est obligatoire').max(100, 'Maximum 100 caractères'),
  email: z.string().trim().optional().or(z.literal('')),
  telephone: z.string().trim().max(30, 'Maximum 30 caractères').optional().or(z.literal('')),
  // SUPER_ADMIN inclus uniquement pour permettre au champ disabled de conserver
  // sa valeur d'origine à l'enregistrement (voir rendu du Select plus bas) —
  // ce rôle reste non assignable via ce formulaire.
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'AUDITEUR', 'VIEWER']),
  actif: z.boolean().default(true),
});

export type UserFormValues = Omit<z.infer<typeof createUserSchema>, 'role'> & {
  role: UserRole;
  organisationId?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statusVariant(actif: boolean): 'success' | 'destructive' {
  return actif ? 'success' : 'destructive';
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground shrink-0" aria-hidden="true">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-[13px] text-foreground break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// View Content Component
// ─────────────────────────────────────────────────────────────────────────────

const UserViewContent = React.memo(function UserViewContent({ user }: { user: UserRow }) {
  const avatarStyle = userAvatarStyle(user.initiales);

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar + Identité */}
      <div className="flex items-center gap-4">
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${avatarStyle}`}
          aria-hidden="true"
        >
          {user.initiales}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[16px] font-semibold text-foreground truncate">{user.fullName}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={statusVariant(user.actif)} className="text-[10px]">
              {user.statutLabel}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {user.roleLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Coordonnées */}
      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={user.email} />
        <InfoRow
          icon={<Phone className="h-3.5 w-3.5" />}
          label="Téléphone"
          value={user.telephone ?? '—'}
        />
        <InfoRow
          icon={<Shield className="h-3.5 w-3.5" />}
          label="Rôle système"
          value={user.roleLabel}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <InfoRow
          icon={<CalendarDays className="h-3.5 w-3.5" />}
          label="Date création"
          value={user.createdAtDisplay || user.createdAt}
        />
        <InfoRow
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Dernière connexion"
          value={user.derniereConnexionDisplay}
        />
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal Component
// ─────────────────────────────────────────────────────────────────────────────

export function UserFormModal({
  open,
  onOpenChange,
  user,
  mode,
  onSaveCreate,
  onSaveUpdate,
  isSaving,
}: UserFormModalProps) {
  const readOnly = mode === 'view';

  // SUPER_ADMIN ne provisionne que des administrateurs d'organisation (ADMIN),
  // jamais les utilisateurs métier — délégué aux org_admin de chaque organisation.
  const isSuperAdmin = useAuthStore(s => s.user?.role === 'SUPER_ADMIN');
  const restrictToOrgAdmin = mode === 'new' && isSuperAdmin;

  const { data: organisations } = useOrganisationsList(restrictToOrgAdmin);
  const activeOrganisations = (organisations ?? []).filter(o => o.statut === 'ACTIVE');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolver = (
    mode === 'new'
      ? zodResolver(restrictToOrgAdmin ? createUserSuperAdminSchema : createUserSchema)
      : zodResolver(updateUserSchema)
  ) as any;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver,
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      role: 'VIEWER',
      organisationId: '',
      actif: true,
    },
  });

  const actifValue = watch('actif');

  useEffect(() => {
    if (open) {
      if (mode === 'new') {
        reset({
          nom: '',
          prenom: '',
          email: '',
          telephone: '',
          role: restrictToOrgAdmin ? 'ADMIN' : 'VIEWER',
          organisationId: '',
          actif: true,
        });
      } else if (user && mode === 'edit') {
        reset({
          nom: user.nom || '',
          prenom: user.prenom || '',
          email: user.email || '',
          telephone: user.telephone || '',
          role: user.role || 'VIEWER',
          actif: user.actif ?? true,
        });
      }
    }
  }, [open, mode, user, reset, restrictToOrgAdmin]);

  const onSubmit: SubmitHandler<UserFormValues> = (data) => {
    if (mode === 'new') {
      onSaveCreate?.({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        role: restrictToOrgAdmin ? 'ADMIN' : (data.role as UserRole),
        telephone: data.telephone || undefined,
        organisationId: restrictToOrgAdmin ? data.organisationId : undefined,
      });
    } else if (mode === 'edit' && user) {
      onSaveUpdate?.({
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone || undefined,
        role: data.role as UserRole,
        actif: data.actif,
      });
    }
  };

  const titles: Record<UserFormModalMode, string> = {
    view: 'Profil utilisateur',
    edit: "Modifier l'utilisateur",
    new: restrictToOrgAdmin ? "Nouvel administrateur d'organisation" : 'Nouvel utilisateur',
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>{titles[mode]}</ModalTitle>
          <ModalDescription>
            {readOnly
              ? `Détail et profil de ${user?.fullName ?? "l'utilisateur"}`
              : mode === 'new'
                ? restrictToOrgAdmin
                  ? "Provisionne le premier (ou un nouvel) administrateur d'une organisation existante."
                  : "Création d'un nouveau compte utilisateur dans le système."
                : `Modification des informations de ${user?.fullName ?? "l'utilisateur"}`}
          </ModalDescription>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {readOnly && user ? (
            <UserViewContent user={user} />
          ) : (
            <form id="user-form-modal" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prénom */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="u-prenom">
                  Prénom *
                </label>
                <Input
                  id="u-prenom"
                  {...register('prenom')}
                  placeholder="Prénom"
                  aria-invalid={errors.prenom ? 'true' : 'false'}
                  aria-describedby={errors.prenom ? 'error-prenom' : undefined}
                />
                {errors.prenom && (
                  <span id="error-prenom" role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {errors.prenom.message}
                  </span>
                )}
              </div>

              {/* Nom */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="u-nom">
                  Nom *
                </label>
                <Input
                  id="u-nom"
                  {...register('nom')}
                  placeholder="Nom de famille"
                  aria-invalid={errors.nom ? 'true' : 'false'}
                  aria-describedby={errors.nom ? 'error-nom' : undefined}
                />
                {errors.nom && (
                  <span id="error-nom" role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {errors.nom.message}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="u-email">
                  Adresse email *
                </label>
                <Input
                  id="u-email"
                  type="email"
                  {...register('email')}
                  disabled={mode === 'edit'}
                  placeholder="prenom.nom@sigp.local"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'error-email' : undefined}
                />
                {mode === 'edit' ? (
                  <span className="text-[11px] text-muted-foreground">
                    L&apos;adresse email ne peut pas être modifiée après création.
                  </span>
                ) : (
                  errors.email && (
                    <span id="error-email" role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {errors.email.message}
                    </span>
                  )
                )}
              </div>

              {/* Aucun mot de passe à saisir, dans les deux flux de création :
                  le compte est créé par invitation, le collaborateur définit
                  lui-même son mot de passe via le lien reçu par e-mail. */}
              {mode === 'new' && (
                <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 sm:col-span-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground">
                    Un e-mail d'invitation sera envoyé à cette adresse pour que{' '}
                    {restrictToOrgAdmin ? "l'administrateur" : 'ce collaborateur'} définisse
                    lui-même son mot de passe et active son compte.
                  </p>
                </div>
              )}

              {/* Téléphone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="u-tel">
                  Téléphone
                </label>
                <Input
                  id="u-tel"
                  type="tel"
                  {...register('telephone')}
                  placeholder="+225 01 02 03 04 05"
                  aria-invalid={errors.telephone ? 'true' : 'false'}
                  aria-describedby={errors.telephone ? 'error-telephone' : undefined}
                />
                {errors.telephone && (
                  <span id="error-telephone" role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {errors.telephone.message}
                  </span>
                )}
              </div>

              {/* Statut */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="u-statut">
                  Statut
                </label>
                <Select
                  id="u-statut"
                  value={actifValue ? 'Actif' : 'Désactivé'}
                  onChange={(e) => setValue('actif', e.target.value === 'Actif', { shouldValidate: true })}
                  disabled={mode === 'new'}
                >
                  <option value="Actif">Actif</option>
                  <option value="Désactivé">Désactivé</option>
                </Select>
              </div>

              {/* Rôle */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="u-role">
                  Rôle système *
                </label>
                {mode === 'edit' && user?.role === 'SUPER_ADMIN' ? (
                  <>
                    <Select id="u-role" {...register('role')} disabled>
                      <option value="SUPER_ADMIN">{USER_ROLE_LABELS.SUPER_ADMIN}</option>
                    </Select>
                    <span className="text-[11px] text-muted-foreground">
                      Le rôle Super Administrateur ne peut pas être modifié depuis ce formulaire.
                    </span>
                  </>
                ) : restrictToOrgAdmin ? (
                  <>
                    <Select id="u-role" {...register('role')} disabled aria-describedby="u-role-hint">
                      <option value="ADMIN">{USER_ROLE_LABELS.ADMIN}</option>
                    </Select>
                    <span id="u-role-hint" className="text-[11px] text-muted-foreground">
                      En tant que Super Administrateur, vous ne provisionnez que des administrateurs
                      d'organisation — la gestion des autres utilisateurs est déléguée à chaque organisation.
                    </span>
                  </>
                ) : (
                  <>
                    <Select
                      id="u-role"
                      {...register('role')}
                      aria-invalid={errors.role ? 'true' : 'false'}
                      aria-describedby={errors.role ? 'error-role' : undefined}
                    >
                      {USER_ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </Select>
                    {errors.role && (
                      <span id="error-role" role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {errors.role.message}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Organisation de rattachement (SUPER_ADMIN uniquement, création) */}
              {restrictToOrgAdmin && (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="u-organisation">
                    <Building2 className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" aria-hidden="true" />
                    Organisation de rattachement *
                  </label>
                  <Select
                    id="u-organisation"
                    {...register('organisationId')}
                    aria-invalid={errors.organisationId ? 'true' : 'false'}
                    aria-describedby={errors.organisationId ? 'error-organisation' : undefined}
                    defaultValue=""
                  >
                    <option value="" disabled>Sélectionner une organisation active…</option>
                    {activeOrganisations.map((org) => (
                      <option key={org.id} value={org.id}>{org.nom}</option>
                    ))}
                  </Select>
                  {errors.organisationId && (
                    <span id="error-organisation" role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {errors.organisationId.message}
                    </span>
                  )}
                </div>
              )}
            </form>
          )}
        </div>

        <ModalFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <ModalClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </ModalClose>
          {!readOnly && (
            <Button
              type="submit"
              form="user-form-modal"
              variant="default"
              disabled={isSaving}
            >
              {isSaving
                ? 'Enregistrement...'
                : mode === 'edit'
                  ? 'Enregistrer'
                  : "Créer l'utilisateur"}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
