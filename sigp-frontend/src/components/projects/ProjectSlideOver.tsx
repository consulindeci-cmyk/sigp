import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, CalendarDays, User, MapPin, Banknote, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Badge } from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverDescription, SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { statusVariant, progressColor } from '@/components/projects/ProjectCard';
import { statusToStatut, statutToStatus, computeInitiales, type Project, type ProjectSector } from '@/lib/projectAdapter';
import { useProjectsReferenceOptions } from '@/hooks/useProjects';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectSlideOverMode = 'view' | 'edit';

export interface ProjectSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  mode: ProjectSlideOverMode;
  onSave?: (data: Partial<Project>) => void;
  saveError?: string | null;
  isSaving?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="text-[13px] text-foreground">{children}</div>
    </div>
  );
}

// ── Form state types ──────────────────────────────────────────────────────────

interface FormValues {
  code: string;
  status: string;
  name: string;
  description: string;
  donor: string;
  sector: string;
  country: string;
  managerId: string;
  startDate: string;
  endDate: string;
  dateFinEffective: string;
  dateClotureEffective: string;
  budgetTotal: string;
  devise: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  code: '', status: 'EN_PREPARATION', name: '', description: '',
  donor: '', sector: '', country: '', managerId: '',
  startDate: '', endDate: '', dateFinEffective: '', dateClotureEffective: '',
  budgetTotal: '', devise: 'XOF',
};

function projectToForm(p: Project): FormValues {
  return {
    code: p.code,
    status: p.statut || statusToStatut(p.status) || 'EN_PREPARATION',
    name: p.name,
    description: p.description,
    donor: p.donor,
    sector: p.sector,
    country: p.country,
    managerId: p.managerId || '',
    startDate: p.startDate,
    endDate: p.endDate,
    dateFinEffective: p.dateFinEffective || '',
    dateClotureEffective: p.dateClotureEffective || '',
    budgetTotal: p.budgetTotal ? String(p.budgetTotal) : '',
    devise: p.devise || 'XOF',
  };
}

// ── FieldRow helper ───────────────────────────────────────────────────────────

function FieldRow({
  id, label, error, required = false, full = false, children,
}: {
  id?: string;
  label: string;
  error?: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', full && 'sm:col-span-2')}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

// ── View mode ─────────────────────────────────────────────────────────────────

function ProjectViewContent({ project }: { project: Project }) {
  const isClosed = project.statut === 'CLOTURE';
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="font-mono text-[11px]">{project.code}</Badge>
          <Badge variant={statusVariant(project.status)} className="text-[11px]">{project.status}</Badge>
          <Badge variant="outline" className="text-[11px]">{project.sector}</Badge>
        </div>
        <h3 className="text-[15px] font-semibold text-foreground leading-snug">{project.name}</h3>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{project.description}</p>
      </div>

      {/* Grid détails */}
      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <DetailRow label="Bailleur">
          <span className="font-medium">{project.donor || '—'}</span>
        </DetailRow>
        <DetailRow label="Pays">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
            {project.country || '—'}
          </div>
        </DetailRow>
        <div className="col-span-2">
          <DetailRow label="Chef de projet">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                {project.initialesManager}
              </div>
              <User className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              {project.manager || '—'}
            </div>
          </DetailRow>
        </div>
        <DetailRow label="Date début">
          <div className="flex items-center gap-1 font-mono">
            <CalendarDays className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
            {formatDate(project.startDate)}
          </div>
        </DetailRow>
        <DetailRow label="Date fin">
          <div className="flex items-center gap-1 font-mono">
            <CalendarDays className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
            {formatDate(project.endDate)}
          </div>
        </DetailRow>
        {isClosed && (
          <>
            <DetailRow label="Date fin effective">
              <div className="flex items-center gap-1 font-mono">
                <CalendarDays className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
                {formatDate(project.dateFinEffective)}
              </div>
            </DetailRow>
            <DetailRow label="Date de clôture">
              <div className="flex items-center gap-1 font-mono">
                <CalendarDays className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
                {formatDate(project.dateClotureEffective)}
              </div>
            </DetailRow>
          </>
        )}
      </div>

      {/* Budget */}
      <div className="bg-muted/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Banknote className="h-3 w-3" aria-hidden="true" />
            Budget total
          </div>
          <span className="font-mono text-[16px] font-bold text-foreground">{project.budgetDisplay}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {project.devise} — Taux de décaissement : {project.tauxDecaissement}%
        </p>
        <ProgressBar
          value={project.tauxDecaissement}
          size="sm"
          color={progressColor(project.tauxDecaissement)}
          className="mt-2"
          aria-label={`Taux de décaissement ${project.tauxDecaissement}%`}
        />
      </div>

      {/* Avancement */}
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold uppercase tracking-wider text-muted-foreground">Progression physique</span>
            <span className="font-mono font-semibold text-foreground">{project.progressScore}%</span>
          </div>
          <ProgressBar
            value={project.progressScore}
            size="sm"
            color={progressColor(project.progressScore)}
            aria-label={`Progression ${project.progressScore}%`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold uppercase tracking-wider text-muted-foreground">Profil qualité</span>
            <span className="font-mono font-semibold text-foreground">{project.profileScore}%</span>
          </div>
          <ProgressBar
            value={project.profileScore}
            size="sm"
            color="warning"
            aria-label={`Profil ${project.profileScore}%`}
          />
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
        {[
          { label: 'Composantes', value: project.composantes },
          { label: 'Activités',   value: project.activites   },
          { label: 'Livrables',   value: project.livrables   },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1 bg-muted/40 rounded-lg p-3">
            <span className="text-[20px] font-bold text-foreground">{value}</span>
            <span className="text-[10px] text-muted-foreground text-center">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Form mode (controlled) ────────────────────────────────────────────────────

function ProjectFormContent({
  values,
  errors,
  onChange,
}: {
  values: FormValues;
  errors: FormErrors;
  onChange: (k: keyof FormValues, v: string) => void;
}) {
  const { data: refOptions, isLoading: isRefLoading } = useProjectsReferenceOptions();
  const { data: usersList, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, nom, prenom, role')
        .is('deleted_at', null)
        .limit(100);
      if (error) throw error;
      return data as Array<{ id: string; nom: string; prenom: string; role?: string }>;
    },
    staleTime: 60_000,
  });

  const isCloture = values.status === 'CLOTURE';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      <FieldRow id="proj-code" label="Code projet">
        <Input
          id="proj-code"
          value={values.code}
          disabled
          className="opacity-60 cursor-not-allowed"
        />
        <p className="text-[11px] text-muted-foreground">Le code est immuable après création.</p>
      </FieldRow>

      <FieldRow id="proj-statut" label="Statut">
        <Select
          id="proj-statut"
          value={values.status}
          onChange={e => onChange('status', e.target.value)}
        >
          <option value="EN_PREPARATION">En préparation</option>
          <option value="EN_COURS">En bonne voie</option>
          <option value="SUSPENDU">À risque</option>
          <option value="CLOTURE">Clôturé</option>
          <option value="ANNULE">Annulé</option>
        </Select>
      </FieldRow>

      <FieldRow id="proj-nom" label="Nom du projet" error={errors.name} required full>
        <Input
          id="proj-nom"
          value={values.name}
          onChange={e => onChange('name', e.target.value)}
          placeholder="Intitulé complet du projet"
        />
      </FieldRow>

      <FieldRow id="proj-desc" label="Description" full>
        <Textarea
          id="proj-desc"
          value={values.description}
          onChange={e => onChange('description', e.target.value)}
          rows={3}
          placeholder="Description du projet et objectifs principaux"
        />
      </FieldRow>

      <FieldRow id="proj-bailleur" label="Bailleur" error={errors.donor}>
        <Select
          id="proj-bailleur"
          value={values.donor}
          onChange={e => onChange('donor', e.target.value)}
          disabled={isRefLoading}
        >
          <option value="">
            {isRefLoading ? 'Chargement…' : 'Sélectionner un bailleur'}
          </option>
          {(refOptions?.donors ?? []).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
      </FieldRow>

      <FieldRow id="proj-secteur" label="Secteur" error={errors.sector}>
        <Select
          id="proj-secteur"
          value={values.sector}
          onChange={e => onChange('sector', e.target.value)}
          disabled={isRefLoading}
        >
          <option value="">
            {isRefLoading ? 'Chargement…' : 'Sélectionner un secteur'}
          </option>
          {(refOptions?.sectors ?? []).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </FieldRow>

      <FieldRow id="proj-pays" label="Pays" error={errors.country}>
        <Select
          id="proj-pays"
          value={values.country}
          onChange={e => onChange('country', e.target.value)}
          disabled={isRefLoading}
        >
          <option value="">
            {isRefLoading ? 'Chargement…' : 'Sélectionner un pays'}
          </option>
          {(refOptions?.countries ?? []).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </FieldRow>

      <FieldRow id="proj-manager" label="Chef de projet" error={errors.managerId}>
        <Select
          id="proj-manager"
          value={values.managerId}
          onChange={e => onChange('managerId', e.target.value)}
          disabled={isUsersLoading}
        >
          <option value="">
            {isUsersLoading ? 'Chargement…' : 'Sélectionner un chef de projet'}
          </option>
          {(usersList ?? []).map(u => (
            <option key={u.id} value={u.id}>
              {u.prenom} {u.nom} ({u.role ?? 'Utilisateur'})
            </option>
          ))}
        </Select>
        {isUsersLoading && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Chargement des utilisateurs…
          </div>
        )}
      </FieldRow>

      <FieldRow id="proj-debut" label="Date début" error={errors.startDate}>
        <Input
          id="proj-debut"
          type="date"
          value={values.startDate}
          onChange={e => onChange('startDate', e.target.value)}
        />
      </FieldRow>

      <FieldRow id="proj-fin" label="Date fin prévue" error={errors.endDate}>
        <Input
          id="proj-fin"
          type="date"
          value={values.endDate}
          onChange={e => onChange('endDate', e.target.value)}
        />
      </FieldRow>

      {/* Champs de clôture — visibles uniquement si statut = CLOTURE */}
      {isCloture && (
        <>
          <FieldRow id="proj-fin-eff" label="Date fin effective">
            <Input
              id="proj-fin-eff"
              type="date"
              value={values.dateFinEffective}
              onChange={e => onChange('dateFinEffective', e.target.value)}
            />
          </FieldRow>
          <FieldRow id="proj-cloture-eff" label="Date de clôture">
            <Input
              id="proj-cloture-eff"
              type="date"
              value={values.dateClotureEffective}
              onChange={e => onChange('dateClotureEffective', e.target.value)}
            />
          </FieldRow>
        </>
      )}

      <FieldRow id="proj-budget" label="Budget total" error={errors.budgetTotal}>
        <Input
          id="proj-budget"
          type="number"
          min={0}
          step={1000}
          value={values.budgetTotal}
          onChange={e => onChange('budgetTotal', e.target.value)}
          placeholder="ex. 5000000"
        />
      </FieldRow>

      <FieldRow id="proj-devise" label="Devise">
        <Select
          id="proj-devise"
          value={values.devise}
          onChange={e => onChange('devise', e.target.value)}
        >
          <option value="USD">USD — Dollar américain</option>
          <option value="EUR">EUR — Euro</option>
          <option value="XOF">XOF — Franc CFA</option>
        </Select>
      </FieldRow>

    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ProjectSlideOver({
  open,
  onOpenChange,
  project,
  mode,
  onSave,
  saveError,
  isSaving = false,
}: ProjectSlideOverProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  // Sync form when the panel opens or the project changes
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'edit' && project) {
      setValues(projectToForm(project));
    }
  }, [open, mode, project?.id]);

  function handleChange(k: keyof FormValues, v: string) {
    setValues(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!values.name.trim()) errs.name = 'Nom requis';

    // Les champs suivants sont obligatoires uniquement hors phase de préparation
    // (aligné sur @IsOptional() dans le DTO backend — dateDebut, dateFinPrevue, budgetTotal)
    const isPreparation = values.status === 'EN_PREPARATION';
    if (!isPreparation) {
      if (!values.startDate) errs.startDate = 'Date de début requise';
      if (!values.endDate) errs.endDate = 'Date de fin requise';
      if (!values.budgetTotal || Number(values.budgetTotal) <= 0) {
        errs.budgetTotal = 'Montant requis (> 0)';
      }
    }
    if (!values.managerId) errs.managerId = 'Chef de projet requis';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    const budgetTotal = values.budgetTotal ? Number(values.budgetTotal) : undefined;

    // Les initiales sont calculées côté adaptateur à partir des données serveur.
    // Ici on en calcule une version provisoire à partir de ce qu'on sait.
    const selectedUser = values.managerId; // UUID — le nom sera résolu par le serveur
    const initialesManager = computeInitiales(undefined, undefined); // sera mis à jour après refresh

    onSave?.({
      code: values.code.trim() || undefined,
      name: values.name.trim(),
      description: values.description.trim(),
      donor: values.donor || undefined,
      sector: (values.sector || undefined) as ProjectSector | undefined,
      country: values.country || undefined,
      managerId: selectedUser || undefined,
      initialesManager,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      dateFinEffective: values.dateFinEffective || undefined,
      dateClotureEffective: values.dateClotureEffective || undefined,
      budgetTotal,
      devise: values.devise,
      status: statutToStatus(values.status),
      statut: values.status,
    });
    // Parent closes the SlideOver after successful save
  }

  const titles: Record<ProjectSlideOverMode, string> = {
    view: 'Détails du projet',
    edit: 'Modifier le projet',
  };
  const readOnly = mode === 'view';

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent className="sm:max-w-lg">

        <SlideOverHeader>
          <SlideOverTitle>{titles[mode]}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer le panneau">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>
        {/* SlideOverDescription sr-only : requis par Radix UI DialogContent pour l'accessibilité */}
        <SlideOverDescription>
          {readOnly ? 'Consultation des détails du projet' : 'Formulaire de modification du projet'}
        </SlideOverDescription>

        <SlideOverBody>
          {readOnly && project ? (
            <ProjectViewContent project={project} />
          ) : (
            <ProjectFormContent
              values={values}
              errors={errors}
              onChange={handleChange}
            />
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline" disabled={isSaving}>
              {readOnly ? 'Fermer' : 'Annuler'}
            </Button>
          </SlideOverClose>
          {!readOnly && (
            <div className="flex flex-col items-end gap-2 flex-1">
              {saveError && (
                <p className="text-xs text-destructive text-right" role="alert">
                  {saveError}
                </p>
              )}
              <Button variant="default" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </Button>
            </div>
          )}
        </SlideOverFooter>

      </SlideOverContent>
    </SlideOver>
  );
}
