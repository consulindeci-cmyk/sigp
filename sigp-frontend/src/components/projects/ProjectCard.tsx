import { Link } from 'react-router-dom';
import { CalendarDays, User, MapPin, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { Card, CardContent } from '@/components/ui/data-display/Card';
import { ActionsMenu, type ActionItem } from '@/components/projects/ActionsMenu';
import type { Project, ProjectStatus } from '@/mocks/projectsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  } catch { return iso; }
}

export function statusVariant(s: ProjectStatus): 'success' | 'warning' | 'destructive' | 'secondary' | 'default' {
  switch (s) {
    case 'En bonne voie':  return 'success';
    case 'À risque':       return 'warning';
    case 'En retard':      return 'destructive';
    case 'Clôturé':        return 'secondary';
    case 'En préparation': return 'default';
  }
}

export function progressColor(score: number): 'success' | 'primary' | 'warning' | 'destructive' {
  if (score >= 75) return 'success';
  if (score >= 50) return 'primary';
  if (score >= 25) return 'warning';
  return 'destructive';
}

// ─────────────────────────────────────────────────────────────────────────────
// ProjectCard — card view for grid layout
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectCardProps {
  project: Project;
  actions: ActionItem[];
}

export function ProjectCard({ project, actions }: ProjectCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-sm transition-shadow duration-150">
      <CardContent className="flex flex-col gap-3 pt-4 flex-1">
        {/* Top: code + status + menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="font-mono text-[10px]">{project.code}</Badge>
            <Badge variant={statusVariant(project.status)} className="text-[10px]">{project.status}</Badge>
          </div>
          <ActionsMenu actions={actions} aria-label={`Actions pour ${project.name}`} />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <Link
            to={`/projects/${project.id}`}
            className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors leading-snug line-clamp-2"
          >
            {project.name}
          </Link>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{project.description}</p>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="font-medium text-foreground">{project.donor}</span>
            <span>·</span>
            <span>{project.sector}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            {project.country}
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 shrink-0" aria-hidden="true" />
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-bold shrink-0">
                {project.initialesManager}
              </div>
              {project.manager}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="font-mono">
              {formatDateShort(project.startDate)} → {formatDateShort(project.endDate)}
            </span>
          </div>
        </div>

        {/* Budget */}
        <div className="flex items-center justify-between border-t border-border pt-2 mt-auto">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Budget</span>
          <span className="font-mono text-[13px] font-semibold text-foreground">{project.budgetDisplay}</span>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Progression</span>
              <span className="font-mono font-semibold text-foreground">{project.progressScore}%</span>
            </div>
            <ProgressBar
              value={project.progressScore}
              size="xs"
              color={progressColor(project.progressScore)}
              aria-label={`Progression ${project.progressScore}%`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Décaissement</span>
              <span className="font-mono font-semibold text-foreground">{project.tauxDecaissement}%</span>
            </div>
            <ProgressBar
              value={project.tauxDecaissement}
              size="xs"
              color={progressColor(project.tauxDecaissement)}
              aria-label={`Taux de décaissement ${project.tauxDecaissement}%`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
