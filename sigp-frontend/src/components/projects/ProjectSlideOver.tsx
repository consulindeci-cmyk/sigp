import { X, CalendarDays, User, MapPin, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Badge } from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverDescription, SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { statusVariant, progressColor } from '@/components/projects/ProjectCard';
import type { Project } from '@/lib/projectAdapter';

// ── Types ─────────────────────────────────────────────────────────────────────
// Lecture seule uniquement — la modification a été déplacée vers
// ProjectEditModal (modale centrée), cohérente avec ProjectCreateModal.

export interface ProjectSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
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

// ── View content ──────────────────────────────────────────────────────────────

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
            color={progressColor(project.profileScore)}
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

// ── Main export ───────────────────────────────────────────────────────────────

export function ProjectSlideOver({ open, onOpenChange, project }: ProjectSlideOverProps) {
  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent className="sm:max-w-lg">

        <SlideOverHeader>
          <SlideOverTitle>Détails du projet</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer le panneau">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>
        {/* SlideOverDescription sr-only : requis par Radix UI DialogContent pour l'accessibilité */}
        <SlideOverDescription>Consultation des détails du projet</SlideOverDescription>

        <SlideOverBody>
          {project && <ProjectViewContent project={project} />}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">Fermer</Button>
          </SlideOverClose>
        </SlideOverFooter>

      </SlideOverContent>
    </SlideOver>
  );
}
