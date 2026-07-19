import React, { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, CalendarDays, Clock, Shield, AlertCircle, Building2, CheckCircle2, Pencil } from 'lucide-react';
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
import { useLookupUserByEmail, type LookupUserResult } from '@/hooks/useUsers';
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
  saveError?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schema (Zod) — mode "edit" uniquement. Le mode "new" utilise un
// flux "email d'abord" (vérification serveur avant de débloquer l'identité),
// géré en état local plutôt qu'en schéma statique — cf. NewUserForm plus bas.
// ─────────────────────────────────────────────────────────────────────────────

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

export type UserFormValues = z.infer<typeof updateUserSchema>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statusVariant(user: UserRow): 'success' | 'destructive' | 'warning' {
  if (!user.actif) return 'destructive';
  if (user.isPending) return 'warning';
  return 'success';
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

function FieldRow({
  id, label, error, required = false, full = false, children,
}: {
  id?: string; label: string; error?: string; required?: boolean; full?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5${full ? ' sm:col-span-2' : ''}`}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <span role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          {error}
        </span>
      )}
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
            <Badge variant={statusVariant(user)} className="text-[10px]">
              {user.statutLabel}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {user.roleLabel}
            </Badge>
          </div>
          {user.isPending && (
            <p className="text-[11px] text-warning">
              Invitation envoyée — en attente de la première connexion.
            </p>
          )}
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
// Mode "new" — flux email d'abord
// ─────────────────────────────────────────────────────────────────────────────

interface NewUserFormProps {
  restrictToOrgAdmin: boolean;
  activeOrganisations: { id: string; nom: string }[];
  onSubmit: (data: CreateUserPayload) => void;
  formId: string;
  onValidityChange: (valid: boolean) => void;
}

const NewUserForm = React.forwardRef<{ submit: () => void }, NewUserFormProps>(function NewUserForm(
  { restrictToOrgAdmin, activeOrganisations, onSubmit, formId, onValidityChange },
  ref,
) {
  // ADMIN (org_admin) rattache toujours vers sa propre organisation — le
  // sélecteur d'organisation n'existe que pour SUPER_ADMIN (restrictToOrgAdmin).
  const ownOrganisationId = useAuthStore(s => s.user?.organisationId);
  const [organisationId, setOrganisationId] = useState('');
  const [email, setEmail] = useState('');
  const [checkedEmail, setCheckedEmail] = useState<string | null>(null);
  const [lookup, setLookup] = useState<LookupUserResult | null>(null);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [role, setRole] = useState<UserRole>(restrictToOrgAdmin ? 'ADMIN' : 'VIEWER');
  const [errors, setErrors] = useState<{ email?: string; nom?: string; prenom?: string; organisation?: string }>({});

  const lookupMutation = useLookupUserByEmail();

  const emailValid = EMAIL_REGEX.test(email.trim());
  const isChecked = checkedEmail === email.trim().toLowerCase() && lookup !== null;
  const canUnlockIdentity = isChecked && (lookup?.status === 'new' || lookup?.status === 'orphan');

  async function handleCheck() {
    setErrors((e) => ({ ...e, email: undefined, organisation: undefined }));
    if (!emailValid) { setErrors((e) => ({ ...e, email: "L'adresse email est invalide" })); return; }
    if (restrictToOrgAdmin && !organisationId) {
      setErrors((e) => ({ ...e, organisation: "Sélectionnez d'abord l'organisation" }));
      return;
    }
    const trimmed = email.trim().toLowerCase();
    const result = await lookupMutation.mutateAsync({
      email: trimmed,
      organisationId: restrictToOrgAdmin ? organisationId : undefined,
    });
    setCheckedEmail(trimmed);
    setLookup(result);
    if (result.status === 'orphan' || result.status === 'same_org') {
      setNom(result.nom ?? '');
      setPrenom(result.prenom ?? '');
    } else {
      setNom('');
      setPrenom('');
    }
  }

  function handleEditEmail() {
    setCheckedEmail(null);
    setLookup(null);
    setNom('');
    setPrenom('');
  }

  function validate(): boolean {
    if (!canUnlockIdentity) return false;
    const errs: typeof errors = {};
    if (lookup?.status === 'new') {
      if (!nom.trim()) errs.nom = 'Requis';
      if (!prenom.trim()) errs.prenom = 'Requis';
    }
    setErrors((e) => ({ ...e, ...errs }));
    return Object.keys(errs).length === 0;
  }

  const isValid = canUnlockIdentity && (lookup?.status !== 'new' || (!!nom.trim() && !!prenom.trim()));
  useEffect(() => { onValidityChange(isValid); }, [isValid, onValidityChange]);

  React.useImperativeHandle(ref, () => ({
    submit: () => {
      if (!validate() || !lookup) return;
      if (lookup.status === 'orphan' && lookup.id) {
        // users-update exige un organisationId explicite pour rattacher un
        // orphelin — un ADMIN (org_admin) rattache toujours vers la sienne.
        const targetOrgId = restrictToOrgAdmin ? organisationId : (ownOrganisationId ?? undefined);
        onSubmit({
          email: email.trim().toLowerCase(),
          existingUserId: lookup.id,
          organisationId: targetOrgId,
          role: restrictToOrgAdmin ? 'ADMIN' : role,
          telephone: telephone.trim() || undefined,
        });
      } else if (lookup.status === 'new') {
        onSubmit({
          email: email.trim().toLowerCase(),
          nom: nom.trim(),
          prenom: prenom.trim(),
          telephone: telephone.trim() || undefined,
          role: restrictToOrgAdmin ? 'ADMIN' : role,
          organisationId: restrictToOrgAdmin ? organisationId : undefined,
        });
      }
    },
  }), [lookup, nom, prenom, telephone, role, email, organisationId, restrictToOrgAdmin, ownOrganisationId]);

  return (
    <form id={formId} onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {restrictToOrgAdmin && (
        <FieldRow id="u-organisation" label="Organisation de rattachement" error={errors.organisation} required full>
          <Select
            id="u-organisation"
            value={organisationId}
            onChange={(e) => { setOrganisationId(e.target.value); handleEditEmail(); }}
            disabled={isChecked}
          >
            <option value="" disabled>Sélectionner une organisation active…</option>
            {activeOrganisations.map((org) => (
              <option key={org.id} value={org.id}>{org.nom}</option>
            ))}
          </Select>
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          </span>
        </FieldRow>
      )}

      <FieldRow id="u-email" label="Adresse email" error={errors.email} required full>
        <div className="flex gap-2">
          <Input
            id="u-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (isChecked) handleEditEmail(); }}
            placeholder="prenom.nom@sigp.local"
            disabled={isChecked}
            className="flex-1"
          />
          {isChecked ? (
            <Button type="button" variant="outline" onClick={handleEditEmail} leftIcon={<Pencil className="h-3.5 w-3.5" />}>
              Modifier
            </Button>
          ) : (
            <Button type="button" variant="default" onClick={handleCheck} disabled={!emailValid || lookupMutation.isPending}>
              {lookupMutation.isPending ? 'Vérification…' : 'Vérifier'}
            </Button>
          )}
        </div>
      </FieldRow>

      {isChecked && lookup?.status === 'same_org' && (
        <div className="sm:col-span-2 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-warning" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>Cet utilisateur fait déjà partie de votre organisation — pas besoin de le réinviter.</span>
        </div>
      )}
      {isChecked && lookup?.status === 'other_org' && (
        <div className="sm:col-span-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>Cet email est déjà associé à un compte d'une autre organisation — rattachement impossible.</span>
        </div>
      )}
      {isChecked && lookup?.status === 'orphan' && (
        <div className="sm:col-span-2 flex items-start gap-2 rounded-md border border-info/30 bg-info/10 px-3 py-2.5 text-sm text-info" role="status">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>Profil existant trouvé — il sera rattaché à votre organisation. Nom et prénom ne sont plus modifiables ici.</span>
        </div>
      )}
      {isChecked && lookup?.status === 'new' && (
        <div className="sm:col-span-2 flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground" role="status">
          <Mail className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>Nouvel email — un e-mail d'invitation sera envoyé pour que la personne définisse son mot de passe.</span>
        </div>
      )}

      {canUnlockIdentity && (
        <>
          <FieldRow id="u-prenom" label="Prénom" error={errors.prenom} required={lookup?.status === 'new'}>
            <Input
              id="u-prenom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Prénom"
              disabled={lookup?.status === 'orphan'}
            />
          </FieldRow>
          <FieldRow id="u-nom" label="Nom" error={errors.nom} required={lookup?.status === 'new'}>
            <Input
              id="u-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom de famille"
              disabled={lookup?.status === 'orphan'}
            />
          </FieldRow>
          <FieldRow id="u-tel" label="Téléphone">
            <Input
              id="u-tel"
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="+225 01 02 03 04 05"
            />
          </FieldRow>
          <FieldRow id="u-role" label="Rôle système" required full={restrictToOrgAdmin}>
            {restrictToOrgAdmin ? (
              <>
                <Select id="u-role" value="ADMIN" disabled>
                  <option value="ADMIN">{USER_ROLE_LABELS.ADMIN}</option>
                </Select>
                <span className="text-[11px] text-muted-foreground">
                  En tant que Super Administrateur, vous ne provisionnez que des administrateurs d'organisation.
                </span>
              </>
            ) : (
              <Select id="u-role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                {USER_ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            )}
          </FieldRow>
        </>
      )}
    </form>
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
  saveError,
}: UserFormModalProps) {
  const readOnly = mode === 'view';

  // SUPER_ADMIN ne provisionne que des administrateurs d'organisation (ADMIN),
  // jamais les utilisateurs métier — délégué aux org_admin de chaque organisation.
  const isSuperAdmin = useAuthStore(s => s.user?.role === 'SUPER_ADMIN');
  const restrictToOrgAdmin = mode === 'new' && isSuperAdmin;

  const { data: organisations } = useOrganisationsList(restrictToOrgAdmin);
  const activeOrganisations = (organisations ?? []).filter(o => o.statut === 'ACTIVE');

  const newFormRef = React.useRef<{ submit: () => void }>(null);
  const [newFormValid, setNewFormValid] = useState(false);
  // Remonter le formulaire "new" à chaque ouverture pour repartir d'un état propre.
  const [newFormKey, setNewFormKey] = useState(0);
  useEffect(() => { if (open && mode === 'new') setNewFormKey(k => k + 1); }, [open, mode]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolver = zodResolver(updateUserSchema) as any;

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
      nom: '', prenom: '', email: '', telephone: '', role: 'VIEWER', actif: true,
    },
  });

  const actifValue = watch('actif');

  useEffect(() => {
    if (open && user && mode === 'edit') {
      reset({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        role: user.role || 'VIEWER',
        actif: user.actif ?? true,
      });
    }
  }, [open, mode, user, reset]);

  const onEditSubmit: SubmitHandler<UserFormValues> = (data) => {
    if (mode === 'edit' && user) {
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

  const formId = 'user-form-modal';

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
                  ? "Vérifiez l'email avant de provisionner un administrateur d'organisation."
                  : "Vérifiez l'email avant de créer ou d'inviter un utilisateur."
                : `Modification des informations de ${user?.fullName ?? "l'utilisateur"}`}
          </ModalDescription>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {readOnly && user ? (
            <UserViewContent user={user} />
          ) : mode === 'new' ? (
            <NewUserForm
              key={newFormKey}
              ref={newFormRef}
              restrictToOrgAdmin={restrictToOrgAdmin}
              activeOrganisations={activeOrganisations}
              onSubmit={(data) => onSaveCreate?.(data)}
              formId={formId}
              onValidityChange={setNewFormValid}
            />
          ) : (
            <form id={formId} onSubmit={handleSubmit(onEditSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  disabled
                  placeholder="prenom.nom@sigp.local"
                />
                <span className="text-[11px] text-muted-foreground">
                  L&apos;adresse email ne peut pas être modifiée après création.
                </span>
              </div>

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
                {user?.role === 'SUPER_ADMIN' ? (
                  <>
                    <Select id="u-role" {...register('role')} disabled>
                      <option value="SUPER_ADMIN">{USER_ROLE_LABELS.SUPER_ADMIN}</option>
                    </Select>
                    <span className="text-[11px] text-muted-foreground">
                      Le rôle Super Administrateur ne peut pas être modifié depuis ce formulaire.
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
            </form>
          )}
          {saveError && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{saveError}</span>
            </div>
          )}
        </div>

        <ModalFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <ModalClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </ModalClose>
          {!readOnly && mode === 'new' && (
            <Button
              type="button"
              variant="default"
              disabled={isSaving || !newFormValid}
              onClick={() => newFormRef.current?.submit()}
            >
              {isSaving ? 'Enregistrement...' : "Créer l'utilisateur"}
            </Button>
          )}
          {!readOnly && mode === 'edit' && (
            <Button
              type="submit"
              form={formId}
              variant="default"
              disabled={isSaving}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
