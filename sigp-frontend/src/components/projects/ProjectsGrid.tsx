import { MemoProjectCard } from '@/components/projects/ProjectCard';
import { type ActionItem } from '@/components/projects/ActionsMenu';
import { type ProjectRow } from '@/lib/projectAdapter';
import { Button } from '@/components/ui/forms/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ProjectsGridProps {
  projects: ProjectRow[];
  isLoading: boolean;
  getActions: (row: ProjectRow) => ActionItem[];
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  rowCount: number;
  onPageChange: (updater: (prev: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number }) => void;
}

export function ProjectsGrid({
  projects,
  isLoading,
  getActions,
  pageIndex,
  pageSize,
  pageCount,
  rowCount,
  onPageChange,
}: ProjectsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 rounded-xl border border-border bg-card/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-muted/20">
        <p className="text-sm font-semibold text-foreground">Aucun projet trouvé</p>
        <p className="text-xs text-muted-foreground mt-1">
          Modifiez vos critères de recherche ou de filtrage pour afficher des résultats.
        </p>
      </div>
    );
  }

  const startIdx = pageIndex * pageSize + 1;
  const endIdx = Math.min((pageIndex + 1) * pageSize, rowCount);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((project) => (
          <MemoProjectCard
            key={project.id}
            project={project}
            actions={getActions(project)}
          />
        ))}
      </div>

      {/* Synchronized pagination footer for Grid view per Tâche 9 */}
      <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>
          Affichage de <strong className="text-foreground">{startIdx}</strong> à{' '}
          <strong className="text-foreground">{endIdx}</strong> sur{' '}
          <strong className="text-foreground">{rowCount}</strong> projet(s)
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex <= 0}
            onClick={() => onPageChange((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Précédent
          </Button>
          <span className="font-mono px-2 text-foreground font-semibold">
            Page {pageIndex + 1} / {Math.max(1, pageCount)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex + 1 >= pageCount}
            onClick={() => onPageChange((p) => ({ ...p, pageIndex: Math.min(pageCount - 1, p.pageIndex + 1) }))}
          >
            Suivant
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
