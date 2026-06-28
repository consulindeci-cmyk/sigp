import { X, CalendarDays, User, MapPin, DollarSign, Activity } from 'lucide-react';
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
import type { Project } from '@/mocks/projectsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectSlideOverMode = 'view' | 'edit' | 'new';

export interface ProjectSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  mode: ProjectSlideOverMode;
  onSave?: (data: Partial<Project>) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// View mode
// ─────────────────────────────────────────────────────────────────────────────

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
            <DollarSign className="h-3 w-3" aria-hidden="true" />Budget total
          </div>
          <span className="font-mono text-[16px] font-bold text-foreground">{project.budgetDisplay}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">{project.devise} — Taux de décaissement : {project.tauxDecaissement}%</p>
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
          <ProgressBar value={project.progressScore} size="sm" color={progressColor(project.progressScore)} aria-label={`Progression ${project.progressScore}%`} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold uppercase tracking-wider text-muted-foreground">Profil qualité</span>
            <span className="font-mono font-semibold text-foreground">{project.profileScore}%</span>
          </div>
          <ProgressBar value={project.profileScore} size="sm" color="warning" aria-label={`Profil ${project.profileScore}%`} />
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
        {[
          { label: 'Composantes', value: project.composantes, icon: <Activity className="h-3.5 w-3.5" /> },
          { label: 'Activités', value: project.activites, icon: <Activity className="h-3.5 w-3.5" /> },
          { label: 'Livrables', value: project.livrables, icon: <Activity className="h-3.5 w-3.5" /> },
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

// ─────────────────────────────────────────────────────────────────────────────
// Form mode (edit / new)
// ─────────────────────────────────────────────────────────────────────────────

function ProjectFormContent({ project }: { project: Project | null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-code">Code projet</label>
        <Input id="proj-code" defaultValue={project?.code ?? ''} placeholder="PROJ-XXX" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-statut">Statut</label>
        <Select id="proj-statut" defaultValue={project?.status ?? 'En préparation'}>
          <option value="En préparation">En préparation</option>
          <option value="En bonne voie">En bonne voie</option>
          <option value="À risque">À risque</option>
          <option value="En retard">En retard</option>
          <option value="Clôturé">Clôturé</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-nom">Nom du projet</label>
        <Input id="proj-nom" defaultValue={project?.name ?? ''} placeholder="Intitulé complet du projet" />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-desc">Description</label>
        <Textarea id="proj-desc" defaultValue={project?.description ?? ''} rows={3} placeholder="Description du projet et objectifs" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-bailleur">Bailleur</label>
        <Select id="proj-bailleur" defaultValue={project?.donor ?? ''}>
          <option value="">Sélectionner</option>
          <option value="AFD">AFD</option>
          <option value="Banque Mondiale">Banque Mondiale</option>
          <option value="Union Européenne">Union Européenne</option>
          <option value="USAID">USAID</option>
          <option value="PNUD">PNUD</option>
          <option value="BAD">BAD</option>
          <option value="OMS">OMS</option>
          <option value="UNICEF">UNICEF</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-secteur">Secteur</label>
        <Select id="proj-secteur" defaultValue={project?.sector ?? ''}>
          <option value="">Sélectionner</option>
          <option value="Eau & Assainissement">Eau & Assainissement</option>
          <option value="Agriculture">Agriculture</option>
          <option value="Santé">Santé</option>
          <option value="Éducation">Éducation</option>
          <option value="Infrastructure">Infrastructure</option>
          <option value="Énergie">Énergie</option>
          <option value="Gouvernance">Gouvernance</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-pays">Pays</label>
        <Select id="proj-pays" defaultValue={project?.country ?? ''}>
          <option value="">Sélectionner</option>
          <option value="Niger">Niger</option>
          <option value="Mali">Mali</option>
          <option value="Burkina Faso">Burkina Faso</option>
          <option value="Sénégal">Sénégal</option>
          <option value="Côte d'Ivoire">Côte d'Ivoire</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-manager">Chef de projet</label>
        <Input id="proj-manager" defaultValue={project?.manager ?? ''} placeholder="Nom du chef de projet" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-debut">Date début</label>
        <Input id="proj-debut" type="date" defaultValue={project?.startDate ?? ''} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-fin">Date fin prévue</label>
        <Input id="proj-fin" type="date" defaultValue={project?.endDate ?? ''} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-budget">Budget total</label>
        <Input id="proj-budget" type="number" min={0} defaultValue={project?.budgetTotal ?? ''} placeholder="0" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="proj-devise">Devise</label>
        <Select id="proj-devise" defaultValue={project?.devise ?? 'USD'}>
          <option value="USD">USD — Dollar américain</option>
          <option value="EUR">EUR — Euro</option>
          <option value="XOF">XOF — Franc CFA</option>
        </Select>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function ProjectSlideOver({ open, onOpenChange, project, mode, onSave }: ProjectSlideOverProps) {
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
            <Button variant="ghost" size="sm" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          {readOnly && project ? (
            <ProjectViewContent project={project} />
          ) : (
            <ProjectFormContent project={project} />
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <SlideOverClose asChild>
              <Button variant="default" onClick={() => onSave?.({})}>
                {mode === 'edit' ? 'Enregistrer' : 'Créer le projet'}
              </Button>
            </SlideOverClose>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
