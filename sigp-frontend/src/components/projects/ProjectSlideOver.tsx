import { useState, useEffect } from 'react';
import { X, CalendarDays, User, MapPin, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Badge } from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { statusVariant, progressColor } from '@/components/projects/ProjectCard';
import type { Project, ProjectStatus, ProjectSector } from '@/mocks/projectsMocks';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectSlideOverMode = 'view' | 'edit' | 'new';

export interface ProjectSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  mode: ProjectSlideOverMode;
  onSave?: (data: Partial<Project>) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
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
  manager: string;
  startDate: string;
  endDate: string;
  budgetTotal: string;
  devise: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  code: '', status: 'En préparation', name: '', description: '',
  donor: '', sector: '', country: '', manager: '',
  startDate: '', endDate: '', budgetTotal: '', devise: 'USD',
};

function projectToForm(p: Project): FormValues {
  return {
    code: p.code,
    status: p.status,
    name: p.name,
    description: p.description,
    donor: p.donor,
    sector: p.sector,
    country: p.country,
    manager: p.manager,
    startDate: p.startDate,
    endDate: p.endDate,
    budgetTotal: String(p.budgetTotal),
    devise: p.devise,
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
          <span className="font-medium">{project.donor}</span>
        </DetailRow>
        <DetailRow label="Pays">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
            {project.country}
          </div>
        </DetailRow>
        <div className="col-span-2">
          <DetailRow label="Chef de projet">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                {project.initialesManager}
              </div>
              <User className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              {project.manager}
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
      </div>

      {/* Budget */}
      <div className="bg-muted/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <DollarSign className="h-3 w-3" aria-hidden="true" />
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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      <FieldRow id="proj-code" label="Code projet" error={errors.code} required>
        <Input
          id="proj-code"
          value={values.code}
          onChange={e => onChange('code', e.target.value)}
          placeholder="PROJ-XXX"
        />
      </FieldRow>

      <FieldRow id="proj-statut" label="Statut">
        <Select
          id="proj-statut"
          value={values.status}
          onChange={e => onChange('status', e.target.value)}
        >
          <option value="En préparation">En préparation</option>
          <option value="En bonne voie">En bonne voie</option>
          <option value="À risque">À risque</option>
          <option value="En retard">En retard</option>
          <option value="Clôturé">Clôturé</option>
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

      <FieldRow id="proj-bailleur" label="Bailleur" error={errors.donor} required>
        <Select
          id="proj-bailleur"
          value={values.donor}
          onChange={e => onChange('donor', e.target.value)}
        >
          <option value="">Sélectionner un bailleur</option>
          <option value="AFD">AFD</option>
          <option value="Banque Mondiale">Banque Mondiale</option>
          <option value="Union Européenne">Union Européenne</option>
          <option value="USAID">USAID</option>
          <option value="PNUD">PNUD</option>
          <option value="BAD">BAD</option>
          <option value="OMS">OMS</option>
          <option value="UNICEF">UNICEF</option>
        </Select>
      </FieldRow>

      <FieldRow id="proj-secteur" label="Secteur" error={errors.sector} required>
        <Select
          id="proj-secteur"
          value={values.sector}
          onChange={e => onChange('sector', e.target.value)}
        >
          <option value="">Sélectionner un secteur</option>
          <option value="Eau & Assainissement">Eau & Assainissement</option>
          <option value="Agriculture">Agriculture</option>
          <option value="Santé">Santé</option>
          <option value="Éducation">Éducation</option>
          <option value="Infrastructure">Infrastructure</option>
          <option value="Énergie">Énergie</option>
          <option value="Gouvernance">Gouvernance</option>
        </Select>
      </FieldRow>

      <FieldRow id="proj-pays" label="Pays" error={errors.country} required>
        <Select
          id="proj-pays"
          value={values.country}
          onChange={e => onChange('country', e.target.value)}
        >
          <option value="">Sélectionner un pays</option>
          <option value="Niger">Niger</option>
          <option value="Mali">Mali</option>
          <option value="Burkina Faso">Burkina Faso</option>
          <option value="Sénégal">Sénégal</option>
          <option value="Côte d'Ivoire">Côte d'Ivoire</option>
        </Select>
      </FieldRow>

      <FieldRow id="proj-manager" label="Chef de projet" error={errors.manager} required>
        <Input
          id="proj-manager"
          value={values.manager}
          onChange={e => onChange('manager', e.target.value)}
          placeholder="Prénom Nom"
        />
      </FieldRow>

      <FieldRow id="proj-debut" label="Date début" error={errors.startDate} required>
        <Input
          id="proj-debut"
          type="date"
          value={values.startDate}
          onChange={e => onChange('startDate', e.target.value)}
        />
      </FieldRow>

      <FieldRow id="proj-fin" label="Date fin prévue" error={errors.endDate} required>
        <Input
          id="proj-fin"
          type="date"
          value={values.endDate}
          onChange={e => onChange('endDate', e.target.value)}
        />
      </FieldRow>

      <FieldRow id="proj-budget" label="Budget total" error={errors.budgetTotal} required>
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
}: ProjectSlideOverProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  // Sync form when the panel opens or the mode/project changes
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'new') {
      setValues(EMPTY_FORM);
    } else if (mode === 'edit' && project) {
      setValues(projectToForm(project));
    }
  }, [open, mode, project?.id]);

  function handleChange(k: keyof FormValues, v: string) {
    setValues(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!values.code.trim()) errs.code = 'Code requis';
    if (!values.name.trim()) errs.name = 'Nom requis';
    if (!values.donor) errs.donor = 'Bailleur requis';
    if (!values.sector) errs.sector = 'Secteur requis';
    if (!values.country) errs.country = 'Pays requis';
    if (!values.manager.trim()) errs.manager = 'Chef de projet requis';
    if (!values.startDate) errs.startDate = 'Date requise';
    if (!values.endDate) errs.endDate = 'Date requise';
    if (!values.budgetTotal || Number(values.budgetTotal) <= 0) {
      errs.budgetTotal = 'Montant requis (> 0)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    const budgetTotal = Number(values.budgetTotal);
    const sym = values.devise === 'EUR' ? '€' : values.devise === 'XOF' ? '' : '$';
    const budgetDisplay = budgetTotal >= 1_000_000
      ? `${sym}${(budgetTotal / 1_000_000).toFixed(1)}M`
      : `${sym}${budgetTotal.toLocaleString('fr-FR')}`;

    const parts = values.manager.trim().split(/\s+/);
    const initialesManager = parts.length >= 2
      ? `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
      : (parts[0]?.[0] ?? '').toUpperCase();

    onSave?.({
      code: values.code.trim(),
      name: values.name.trim(),
      description: values.description.trim(),
      donor: values.donor,
      sector: values.sector as ProjectSector,
      country: values.country,
      manager: values.manager.trim(),
      initialesManager,
      startDate: values.startDate,
      endDate: values.endDate,
      budgetTotal,
      devise: values.devise,
      budgetDisplay,
      status: values.status as ProjectStatus,
    });
    // Parent is responsible for closing the SlideOver after successful save
  }

  const titles: Record<ProjectSlideOverMode, string> = {
    view: 'Détails du projet',
    edit: 'Modifier le projet',
    new:  'Nouveau projet',
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
            <Button variant="outline">
              {readOnly ? 'Fermer' : 'Annuler'}
            </Button>
          </SlideOverClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave}>
              {mode === 'edit' ? 'Enregistrer les modifications' : 'Créer le projet'}
            </Button>
          )}
        </SlideOverFooter>

      </SlideOverContent>
    </SlideOver>
  );
}
