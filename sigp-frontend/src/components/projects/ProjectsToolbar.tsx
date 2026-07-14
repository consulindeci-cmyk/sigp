import { Download, Plus, LayoutGrid, List } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/forms/Button';
import { cn } from '@/lib/utils';

export interface ProjectsToolbarProps {
  view: 'table' | 'grid';
  onViewChange: (view: 'table' | 'grid') => void;
  onOpenNew: () => void;
  onExport: () => void;
  isExporting?: boolean;
}

export function ProjectsToolbar({
  view,
  onViewChange,
  onOpenNew,
  onExport,
  isExporting = false,
}: ProjectsToolbarProps) {
  return (
    <PageHeader
      title="Projets"
      subtitle="Gérez, suivez et contrôlez l'avancement de l'ensemble de vos projets de développement"
      actions={
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="flex items-center rounded-md border border-border bg-muted/30 p-0.5"
            role="group"
            aria-label="Mode d'affichage"
          >
            <button
              type="button"
              onClick={() => onViewChange('table')}
              className={cn(
                'flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-medium transition-colors',
                view === 'table'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={view === 'table'}
              aria-label="Affichage tableau"
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              Tableau
            </button>
            <button
              type="button"
              onClick={() => onViewChange('grid')}
              className={cn(
                'flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-medium transition-colors',
                view === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={view === 'grid'}
              aria-label="Affichage grille"
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              Grille
            </button>
          </div>

          {/* Export button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting}
            aria-label="Exporter les projets"
          >
            <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {isExporting ? 'Exportation…' : 'Exporter (CSV)'}
          </Button>

          {/* New project button */}
          <Button size="sm" onClick={onOpenNew} aria-label="Nouveau projet">
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Nouveau Projet
          </Button>
        </div>
      }
    />
  );
}
