import { Download, Plus, LayoutGrid, List, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { cn } from '@/lib/utils';

export interface ProjectsToolbarProps {
  view: 'table' | 'grid';
  onViewChange: (view: 'table' | 'grid') => void;
  onOpenNew: () => void;
  onExport: () => void;
  isExporting?: boolean;
  // SUPER_ADMIN : page de supervision, création réservée aux org_admin.
  canCreate?: boolean;
  // SUPER_ADMIN : filtre Organisation visible ici pour rester accessible
  // peu importe le mode d'affichage (table ET grille), pas seulement dans
  // la barre d'outils du DataTable (absente en vue Grille).
  showOrganisationFilter?: boolean;
  organisationOptions?: { label: string; value: string }[];
  organisationValue?: string;
  onOrganisationChange?: (value: string) => void;
}

export function ProjectsToolbar({
  view,
  onViewChange,
  onOpenNew,
  onExport,
  isExporting = false,
  canCreate = true,
  showOrganisationFilter = false,
  organisationOptions = [],
  organisationValue = '',
  onOrganisationChange,
}: ProjectsToolbarProps) {
  return (
    <PageHeader
      title="Projets"
      subtitle="Gérez, suivez et contrôlez l'avancement de l'ensemble de vos projets de développement"
      actions={
        <div className="flex items-center gap-2">
          {/* Filtre Organisation — SUPER_ADMIN, visible en Table ET en Grille */}
          {showOrganisationFilter && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <Select
                value={organisationValue}
                onChange={(e) => onOrganisationChange?.(e.target.value)}
                aria-label="Filtrer par organisation"
                className="h-8 text-xs min-w-[160px]"
                wrapperClassName="w-auto shrink-0"
              >
                <option value="">Toutes les organisations</option>
                {organisationOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
          )}

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

          {/* New project button — masqué en supervision Super Admin */}
          {canCreate && (
            <Button size="sm" onClick={onOpenNew} aria-label="Nouveau projet">
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Nouveau Projet
            </Button>
          )}
        </div>
      }
    />
  );
}
