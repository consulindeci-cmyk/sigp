import React, { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Mail, Phone, MapPin, CalendarDays, Shield,
  FolderKanban, Users as UsersIcon, AlertCircle, Landmark, Coins, ArrowDownCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
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
import {
  DEVISE_OPTIONS,
  type OrganisationRow,
  type UpdateOrganisationAdminPayload,
  type CreateOrganisationAdminPayload,
} from '@/lib/organisationAdapter';
import { organisationsAdminKeys } from '@/hooks/useOrganisationsAdmin';
import { useUpdateUser } from '@/hooks/useUsers';
import { USER_ROLE_LABELS, type UserRole } from '@/lib/userAdapter';

// ─────────────────────────────────────────────────────────────────────────────
// Schémas — miroir de UserFormModal.tsx (createUserSchema/updateUserSchema)
// ─────────────────────────────────────────────────────────────────────────────

const profileFieldsSchema = {
  nom: z.string().trim().min(1, "Le nom de l'organisation est obligatoire").max(200, 'Maximum 200 caractères'),
  adresse: z.string().trim().max(255, 'Maximum 255 caractères').optional().or(z.literal('')),
  ville: z.string().trim().max(100, 'Maximum 100 caractères').optional().or(z.literal('')),
  pays: z.string().trim().max(100, 'Maximum 100 caractères').optional().or(z.literal('')),
  telephone: z.string().trim().max(30, 'Maximum 30 caractères').optional().or(z.literal('')),
  email: z.string().trim().max(255, 'Maximum 255 caractères').email('Adresse email invalide').optional().or(z.literal('')),
  siteWeb: z.string().trim().max(255, 'Maximum 255 caractères').optional().or(z.literal('')),
  deviseDefaut: z.enum(['XOF', 'EUR', 'USD']),
  identifiantFiscal: z.string().trim().max(100, 'Maximum 100 caractères').optional().or(z.literal('')),
};

export const editOrganisationSchema = z.object(profileFieldsSchema);

export const createOrganisationSchema = z.object({
  ...profileFieldsSchema,
  adminNom: z.string().trim().min(1, 'Le nom est obligatoire').max(100, 'Maximum 100 caractères'),
  adminPrenom: z.string().trim().min(1, 'Le prénom est obligatoire').max(100, 'Maximum 100 caractères'),
  adminEmail: z
    .string()
    .trim()
    .min(1, "L'adresse email est obligatoire")
    .email('Adresse email invalide')
    .max(255, 'Maximum 255 caractères'),
  adminTelephone: z.string().trim().max(30, 'Maximum 30 caractères').optional().or(z.literal('')),
});

export type OrganisationFormValues = z.infer<typeof createOrganisationSchema>;

const EMPTY_FORM: OrganisationFormValues = {
  nom: '', adresse: '', ville: '', pays: '', telephone: '', email: '', siteWeb: '',
  deviseDefaut: 'XOF', identifiantFiscal: '',
  adminNom: '', adminPrenom: '', adminEmail: '', adminTelephone: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type OrganisationFormModalMode = 'view' | 'edit' | 'new';

export interface OrganisationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisation: OrganisationRow | null;
  mode: OrganisationFormModalMode;
  onSaveCreate?: (data: CreateOrganisationAdminPayload) => void;
  onSaveUpdate?: (data: Omit<UpdateOrganisationAdminPayload, 'organisationId'>) => void;
  isSaving?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statutVariant(statut: OrganisationRow['statut']): 'success' | 'destructive' {
  return statut === 'ACTIVE' ? 'success' : 'destructive';
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
// View Content
// ─────────────────────────────────────────────────────────────────────────────

const OrganisationViewContent = React.memo(function OrganisationViewContent({ organisation }: { organisation: OrganisationRow }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0 bg-primary/10 text-primary" aria-hidden="true">
          {organisation.nom.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[16px] font-semibold text-foreground truncate">{organisation.nom}</p>
          <Badge variant={statutVariant(organisation.statut)} className="text-[10px] w-fit">
            {organisation.statutLabel}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <InfoRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Date de création" value={organisation.createdAtDisplay} />
        <InfoRow icon={<FolderKanban className="h-3.5 w-3.5" />} label="Projets actifs" value={String(organisation.projetsActifsCount)} />
        <InfoRow icon={<UsersIcon className="h-3.5 w-3.5" />} label="Utilisateurs" value={String(organisation.utilisateursCount)} />
        <InfoRow icon={<Coins className="h-3.5 w-3.5" />} label="Devise par défaut" value={organisation.deviseDefaut} />
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <InfoRow icon={<Shield className="h-3.5 w-3.5" />} label="Administrateur responsable" value={organisation.orgAdminNom} />
        <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email de l'administrateur" value={organisation.orgAdminEmail} />
      </div>
      {organisation.orgAdminCount > 1 && (
        <p className="text-[11px] text-muted-foreground -mt-3">
          + {organisation.orgAdminCount - 1} autre(s) administrateur(s) sur cette organisation.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email de contact" value={organisation.email} />
        <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Téléphone" value={organisation.telephone} />
        <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Adresse" value={[organisation.adresse, organisation.ville, organisation.pays].filter(Boolean).join(', ')} />
        <InfoRow icon={<Landmark className="h-3.5 w-3.5" />} label="Identifiant fiscal" value={organisation.identifiantFiscal} />
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────────────────────

export function OrganisationFormModal({
  open,
  onOpenChange,
  organisation,
  mode,
  onSaveCreate,
  onSaveUpdate,
  isSaving,
}: OrganisationFormModalProps) {
  const readOnly = mode === 'view';
  const qc = useQueryClient();

  // ── Membres de l'organisation — promotion/rétrogradation d'administrateur ──
  // Réutilise users-update (déjà capable de changer le rôle, et désormais
  // organisation_id pour les profils orphelins), pas de nouvelle Edge Function.
  // La requête remonte deux populations distinctes en un seul aller-retour :
  // les membres actuels de l'organisation (n'importe quel rôle) ET les
  // administrateurs "orphelins" (organisation_id NULL, role ADMIN) — des
  // profils créés sans organisation de rattachement, éligibles à être
  // rattachés ici. Jamais de réaffectation cross-organisation : seuls les
  // profils SANS organisation actuelle peuvent être rattachés (cf. users-update).
  const orgId = organisation?.id;
  const { data: members, isLoading: isMembersLoading } = useQuery({
    queryKey: ['organisation-members', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('users')
        .select('id, nom, prenom, email, role, organisation_id')
        .or(`organisation_id.eq.${orgId},and(organisation_id.is.null,role.eq.ADMIN)`)
        .is('deleted_at', null)
        .order('prenom', { ascending: true });
      if (error) throw error;
      return data as Array<{ id: string; nom: string; prenom: string; email: string; role: UserRole; organisation_id: string | null }>;
    },
    enabled: !!orgId && mode === 'edit',
  });
  const orgMembers = (members ?? []).filter((u) => u.organisation_id === orgId);
  const admins = orgMembers.filter((u) => u.role === 'ADMIN');
  const nonAdmins = orgMembers.filter((u) => u.role !== 'ADMIN');
  const orphanAdmins = (members ?? []).filter((u) => u.organisation_id === null && u.role === 'ADMIN');

  const [promoteUserId, setPromoteUserId] = useState('');
  const [demoteConfirmId, setDemoteConfirmId] = useState<string | null>(null);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const updateUserMutation = useUpdateUser();

  function refreshAfterAdminChange() {
    qc.invalidateQueries({ queryKey: ['organisation-members', orgId] });
    qc.invalidateQueries({ queryKey: organisationsAdminKeys.list() });
  }

  async function handlePromote() {
    if (!promoteUserId || !orgId) return;
    setAdminActionError(null);
    try {
      const target = (members ?? []).find((u) => u.id === promoteUserId);
      const isOrphan = target?.organisation_id === null;
      await updateUserMutation.mutateAsync({
        id: promoteUserId,
        data: { role: 'ADMIN', ...(isOrphan ? { organisationId: orgId } : {}) },
      });
      setPromoteUserId('');
      refreshAfterAdminChange();
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Erreur lors de la promotion.');
    }
  }

  async function handleDemote(userId: string) {
    setAdminActionError(null);
    try {
      await updateUserMutation.mutateAsync({ id: userId, data: { role: 'VIEWER' } });
      setDemoteConfirmId(null);
      refreshAfterAdminChange();
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Erreur lors de la rétrogradation.');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolver = (mode === 'new' ? zodResolver(createOrganisationSchema) : zodResolver(editOrganisationSchema)) as any;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganisationFormValues>({
    resolver,
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (open) {
      if (mode === 'new') {
        reset(EMPTY_FORM);
      } else if (organisation && mode === 'edit') {
        reset({
          ...EMPTY_FORM,
          nom: organisation.nom || '',
          adresse: organisation.adresse || '',
          ville: organisation.ville || '',
          pays: organisation.pays || '',
          telephone: organisation.telephone || '',
          email: organisation.email || '',
          siteWeb: organisation.siteWeb || '',
          deviseDefaut: organisation.deviseDefaut || 'XOF',
          identifiantFiscal: organisation.identifiantFiscal || '',
        });
      }
    }
  }, [open, mode, organisation, reset]);

  const onSubmit: SubmitHandler<OrganisationFormValues> = (data) => {
    if (mode === 'new') {
      onSaveCreate?.({
        nom: data.nom,
        adresse: data.adresse || undefined,
        ville: data.ville || undefined,
        pays: data.pays || undefined,
        telephone: data.telephone || undefined,
        email: data.email || undefined,
        siteWeb: data.siteWeb || undefined,
        deviseDefaut: data.deviseDefaut,
        identifiantFiscal: data.identifiantFiscal || undefined,
        adminNom: data.adminNom,
        adminPrenom: data.adminPrenom,
        adminEmail: data.adminEmail,
        adminTelephone: data.adminTelephone || undefined,
      });
    } else if (mode === 'edit') {
      onSaveUpdate?.({
        nom: data.nom,
        adresse: data.adresse || undefined,
        ville: data.ville || undefined,
        pays: data.pays || undefined,
        telephone: data.telephone || undefined,
        email: data.email || undefined,
        siteWeb: data.siteWeb || undefined,
        deviseDefaut: data.deviseDefaut,
        identifiantFiscal: data.identifiantFiscal || undefined,
      });
    }
  };

  const titles: Record<OrganisationFormModalMode, string> = {
    view: 'Détail organisation',
    edit: "Modifier l'organisation",
    new: 'Nouvelle organisation',
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>{titles[mode]}</ModalTitle>
          <ModalDescription>
            {readOnly
              ? `Détail de ${organisation?.nom ?? "l'organisation"}`
              : mode === 'new'
                ? "Onboarding d'un nouveau tenant : organisation + premier administrateur."
                : `Modification des informations de ${organisation?.nom ?? "l'organisation"}`}
          </ModalDescription>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {readOnly && organisation ? (
            <OrganisationViewContent organisation={organisation} />
          ) : (
            <form id="organisation-form-modal" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="o-nom">
                  Nom de l'organisation *
                </label>
                <Input id="o-nom" {...register('nom')} placeholder="Nom de l'organisation" aria-invalid={errors.nom ? 'true' : 'false'} />
                {errors.nom && (
                  <span role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {errors.nom.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="o-adresse">
                  Adresse
                </label>
                <Input id="o-adresse" {...register('adresse')} placeholder="Adresse" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="o-ville">
                  Ville
                </label>
                <Input id="o-ville" {...register('ville')} placeholder="Ville" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="o-pays">
                  Pays
                </label>
                <Input id="o-pays" {...register('pays')} placeholder="Pays" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="o-telephone">
                  Téléphone
                </label>
                <Input id="o-telephone" type="tel" {...register('telephone')} placeholder="+225 01 02 03 04 05" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="o-email">
                  Email
                </label>
                <Input id="o-email" type="email" {...register('email')} placeholder="contact@organisation.org" aria-invalid={errors.email ? 'true' : 'false'} />
                {errors.email && (
                  <span role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="o-site-web">
                  Site web
                </label>
                <Input id="o-site-web" {...register('siteWeb')} placeholder="https://..." />
              </div>

              <div className="sm:col-span-2 border-t border-border pt-4 mt-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Paramètres financiers
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="o-devise">
                  Devise par défaut *
                </label>
                <Select id="o-devise" {...register('deviseDefaut')} aria-invalid={errors.deviseDefaut ? 'true' : 'false'}>
                  {DEVISE_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="o-identifiant-fiscal">
                  Identifiant fiscal / d'enregistrement
                </label>
                <Input id="o-identifiant-fiscal" {...register('identifiantFiscal')} placeholder="Optionnel" />
              </div>

              {mode === 'edit' && (
                <div className="sm:col-span-2 border-t border-border pt-4 mt-1 flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Administrateur(s) de l'organisation
                  </p>

                  {isMembersLoading ? (
                    <p className="text-xs text-muted-foreground">Chargement des membres…</p>
                  ) : (
                    <>
                      {admins.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Aucun administrateur actif sur cette organisation.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {admins.map((u) => (
                            <div key={u.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-foreground truncate">{u.prenom} {u.nom}</span>
                                <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                              </div>
                              {demoteConfirmId === u.id ? (
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-destructive font-medium">Confirmer ?</span>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => setDemoteConfirmId(null)} disabled={updateUserMutation.isPending}>
                                    Non
                                  </Button>
                                  <Button type="button" variant="destructive" size="sm" onClick={() => handleDemote(u.id)} disabled={updateUserMutation.isPending}>
                                    Oui, rétrograder
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  type="button" variant="outline" size="sm" className="shrink-0"
                                  onClick={() => setDemoteConfirmId(u.id)}
                                  disabled={updateUserMutation.isPending}
                                  leftIcon={<ArrowDownCircle className="h-3.5 w-3.5" />}
                                >
                                  Rétrograder
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-end gap-2">
                        <div className="flex-1 flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-foreground" htmlFor="o-promote-user">
                            Promouvoir / rattacher un administrateur
                          </label>
                          <Select
                            id="o-promote-user"
                            value={promoteUserId}
                            onChange={(e) => setPromoteUserId(e.target.value)}
                            disabled={nonAdmins.length === 0 && orphanAdmins.length === 0}
                          >
                            <option value="">
                              {nonAdmins.length === 0 && orphanAdmins.length === 0
                                ? 'Aucun profil éligible'
                                : 'Sélectionner un utilisateur…'}
                            </option>
                            {nonAdmins.length > 0 && (
                              <optgroup label="Membres de la structure">
                                {nonAdmins.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.prenom} {u.nom} ({USER_ROLE_LABELS[u.role]}) — {u.email}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {orphanAdmins.length > 0 && (
                              <optgroup label="Administrateurs non assignés">
                                {orphanAdmins.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.prenom} {u.nom} — {u.email}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </Select>
                        </div>
                        <Button
                          type="button" variant="default"
                          onClick={handlePromote}
                          disabled={!promoteUserId || updateUserMutation.isPending}
                        >
                          Promouvoir
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Un membre de la structure est promu administrateur ; un administrateur non assigné est
                        automatiquement rattaché à cette organisation. Aucune réaffectation depuis une autre
                        organisation n'est possible.
                      </p>
                      {adminActionError && (
                        <span role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {adminActionError}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              {mode === 'new' && (
                <>
                  <div className="sm:col-span-2 border-t border-border pt-4 mt-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Premier administrateur (org_admin)
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="o-admin-prenom">
                      Prénom *
                    </label>
                    <Input id="o-admin-prenom" {...register('adminPrenom')} placeholder="Prénom" aria-invalid={errors.adminPrenom ? 'true' : 'false'} />
                    {errors.adminPrenom && (
                      <span role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {errors.adminPrenom.message}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="o-admin-nom">
                      Nom *
                    </label>
                    <Input id="o-admin-nom" {...register('adminNom')} placeholder="Nom" aria-invalid={errors.adminNom ? 'true' : 'false'} />
                    {errors.adminNom && (
                      <span role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {errors.adminNom.message}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="o-admin-email">
                      Email *
                    </label>
                    <Input id="o-admin-email" type="email" {...register('adminEmail')} placeholder="admin@organisation.org" aria-invalid={errors.adminEmail ? 'true' : 'false'} />
                    {errors.adminEmail && (
                      <span role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {errors.adminEmail.message}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="o-admin-telephone">
                      Téléphone
                    </label>
                    <Input id="o-admin-telephone" type="tel" {...register('adminTelephone')} placeholder="+225 01 02 03 04 05" />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <p className="text-[11px] text-muted-foreground">
                      Aucun mot de passe à définir ici : un e-mail d'invitation sera envoyé à cette
                      adresse pour que l'administrateur active son compte et choisisse son propre
                      mot de passe. Si cet email est déjà utilisé, la création sera refusée.
                    </p>
                  </div>
                </>
              )}
            </form>
          )}
        </div>

        <ModalFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <ModalClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </ModalClose>
          {!readOnly && (
            <Button type="submit" form="organisation-form-modal" variant="default" disabled={isSaving}>
              {isSaving
                ? 'Enregistrement...'
                : mode === 'edit'
                  ? 'Enregistrer'
                  : "Créer l'organisation"}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
