import React, { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X, Mail, Phone, MapPin, CalendarDays, Shield,
  FolderKanban, Users as UsersIcon, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Badge } from '@/components/ui/data-display/Badge';
import {
  SlideOver,
  SlideOverContent,
  SlideOverHeader,
  SlideOverTitle,
  SlideOverDescription,
  SlideOverBody,
  SlideOverFooter,
  SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import {
  type OrganisationRow,
  type UpdateOrganisationAdminPayload,
  type CreateOrganisationAdminPayload,
} from '@/lib/organisationAdapter';

// ─────────────────────────────────────────────────────────────────────────────
// Schémas — miroir de UserSlideOver.tsx (createUserSchema/updateUserSchema)
// ─────────────────────────────────────────────────────────────────────────────

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const profileFieldsSchema = {
  nom: z.string().trim().min(1, "Le nom de l'organisation est obligatoire").max(200, 'Maximum 200 caractères'),
  adresse: z.string().trim().max(255, 'Maximum 255 caractères').optional().or(z.literal('')),
  ville: z.string().trim().max(100, 'Maximum 100 caractères').optional().or(z.literal('')),
  pays: z.string().trim().max(100, 'Maximum 100 caractères').optional().or(z.literal('')),
  telephone: z.string().trim().max(30, 'Maximum 30 caractères').optional().or(z.literal('')),
  email: z.string().trim().max(255, 'Maximum 255 caractères').email('Adresse email invalide').optional().or(z.literal('')),
  siteWeb: z.string().trim().max(255, 'Maximum 255 caractères').optional().or(z.literal('')),
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
  adminPassword: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Maximum 128 caractères')
    .regex(
      PASSWORD_REGEX,
      'Doit contenir au moins 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial'
    ),
});

export type OrganisationFormValues = z.infer<typeof createOrganisationSchema>;

const EMPTY_FORM: OrganisationFormValues = {
  nom: '', adresse: '', ville: '', pays: '', telephone: '', email: '', siteWeb: '',
  adminNom: '', adminPrenom: '', adminEmail: '', adminTelephone: '', adminPassword: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type OrganisationSlideOverMode = 'view' | 'edit' | 'new';

export interface OrganisationSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisation: OrganisationRow | null;
  mode: OrganisationSlideOverMode;
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

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <InfoRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Date de création" value={organisation.createdAtDisplay} />
        <InfoRow icon={<FolderKanban className="h-3.5 w-3.5" />} label="Projets actifs" value={String(organisation.projetsActifsCount)} />
        <InfoRow icon={<UsersIcon className="h-3.5 w-3.5" />} label="Utilisateurs" value={String(organisation.utilisateursCount)} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <InfoRow icon={<Shield className="h-3.5 w-3.5" />} label="Administrateur responsable" value={organisation.orgAdminNom} />
        <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email de l'administrateur" value={organisation.orgAdminEmail} />
        {organisation.orgAdminCount > 1 && (
          <p className="text-[11px] text-muted-foreground">
            + {organisation.orgAdminCount - 1} autre(s) administrateur(s) sur cette organisation.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email de contact" value={organisation.email} />
        <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Téléphone" value={organisation.telephone} />
        <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Adresse" value={[organisation.adresse, organisation.ville, organisation.pays].filter(Boolean).join(', ')} />
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main SlideOver
// ─────────────────────────────────────────────────────────────────────────────

export function OrganisationSlideOver({
  open,
  onOpenChange,
  organisation,
  mode,
  onSaveCreate,
  onSaveUpdate,
  isSaving,
}: OrganisationSlideOverProps) {
  const readOnly = mode === 'view';

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
        adminNom: data.adminNom,
        adminPrenom: data.adminPrenom,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
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
      });
    }
  };

  const titles: Record<OrganisationSlideOverMode, string> = {
    view: 'Détail organisation',
    edit: "Modifier l'organisation",
    new: 'Nouvelle organisation',
  };

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent className="sm:max-w-md">
        <SlideOverHeader>
          <SlideOverTitle>{titles[mode]}</SlideOverTitle>
          <SlideOverDescription>
            {readOnly
              ? `Détail de ${organisation?.nom ?? "l'organisation"}`
              : mode === 'new'
                ? "Onboarding d'un nouveau tenant : organisation + premier administrateur."
                : `Modification des informations de ${organisation?.nom ?? "l'organisation"}`}
          </SlideOverDescription>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          {readOnly && organisation ? (
            <OrganisationViewContent organisation={organisation} />
          ) : (
            <form id="organisation-slideover-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="o-admin-password">
                      Mot de passe *
                    </label>
                    <Input id="o-admin-password" type="password" {...register('adminPassword')} placeholder="Min. 8 car." aria-invalid={errors.adminPassword ? 'true' : 'false'} />
                    {errors.adminPassword ? (
                      <span role="alert" className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {errors.adminPassword.message}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.
                      </span>
                    )}
                  </div>
                </>
              )}
            </form>
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button type="submit" form="organisation-slideover-form" variant="default" disabled={isSaving}>
              {isSaving
                ? 'Enregistrement...'
                : mode === 'edit'
                  ? 'Enregistrer'
                  : "Créer l'organisation"}
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
