import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Download, Plus, Eye, Edit, Copy, Archive, Trash2,
  LayoutGrid, List, CheckCircle2,
} from 'lucide-react';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { PageHeader } from '@/components/layout/AppShell';
import { Button, buttonVariants } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { Badge } from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { DataTableFilter } from '@/components/ui/data-table/types';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { cn } from '@/lib/utils';

// Project-specific components
import { ProjectKPIs } from '@/components/projects/ProjectKPIs';
import { ProjectCard, statusVariant, progressColor } from '@/components/projects/ProjectCard';
import { ActionsMenu, type ActionItem } from '@/components/projects/ActionsMenu';
import { ProjectSlideOver, type ProjectSlideOverMode } from '@/components/projects/ProjectSlideOver';

// Mock data
import {
  mockProjects,
  uniqueOptions,
  type Project,
  type ProjectsKPIs,
} from '@/mocks/projectsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Static filter options (based on all possible values)
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'En bonne voie', value: 'En bonne voie' },
  { label: 'À risque', value: 'À risque' },
  { label: 'En retard', value: 'En retard' },
  { label: 'Clôturé', value: 'Clôturé' },
  { label: 'En préparation', value: 'En préparation' },
];

const projectFilters: DataTableFilter[] = [
  { id: 'status', title: 'Statut', options: STATUS_OPTIONS },
  { id: 'donor',  title: 'Bailleur', options: uniqueOptions(mockProjects, 'donor') },
  { id: 'sector', title: 'Secteur',  options: uniqueOptions(mockProjects, 'sector') },
  { id: 'country', title: 'Pays',   options: uniqueOptions(mockProjects, 'country') },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  } catch { return iso; }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProjectsPage
// ─────────────────────────────────────────────────────────────────────────────

type ViewMode = 'table' | 'grid';
type ExportFormat = 'xlsx' | 'csv' | 'pdf';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [view, setView] = useState<ViewMode>('table');

  // SlideOver
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<ProjectSlideOverMode>('view');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Export modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [exportDone, setExportDone] = useState(false);

  // ── Dynamic KPIs ──────────────────────────────────────────────────────────
  const kpis = useMemo<ProjectsKPIs>(() => ({
    total: projects.length,
    enBonneVoie: projects.filter((p) => p.status === 'En bonne voie').length,
    aRisque:     projects.filter((p) => p.status === 'À risque').length,
    enRetard:    projects.filter((p) => p.status === 'En retard').length,
    clotured:    projects.filter((p) => p.status === 'Clôturé').length,
    budgetPortefeuille:
      '$' + (projects.reduce((s, p) => s + p.budgetTotal, 0) / 1_000_000).toFixed(1) + 'M',
  }), [projects]);

  // ── Actions ───────────────────────────────────────────────────────────────
  function openView(project: Project) {
    setSelectedProject(project);
    setSlideOverMode('view');
    setSlideOverOpen(true);
  }

  function openEdit(project: Project) {
    setSelectedProject(project);
    setSlideOverMode('edit');
    setSlideOverOpen(true);
  }

  function handleDuplicate(project: Project) {
    const dup: Project = {
      ...project,
      id: `dup-${Date.now()}`,
      code: `${project.code}-COPY`,
      name: `${project.name} (Copie)`,
      status: 'En préparation',
      progressScore: 0,
      tauxDecaissement: 0,
    };
    setProjects((prev) => [dup, ...prev]);
  }

  function handleArchive(project: Project) {
    setProjects((prev) =>
      prev.map((p) => p.id === project.id ? { ...p, status: 'Clôturé' as const } : p)
    );
  }

  function openDelete(project: Project) {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  }

  function handleDeleteConfirm() {
    if (!projectToDelete) return;
    setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
    setDeleteModalOpen(false);
    setProjectToDelete(null);
  }

  function handleExport() {
    setExportDone(true);
    setTimeout(() => {
      setExportDone(false);
      setExportModalOpen(false);
    }, 1500);
  }

  function handleSave() {
    setSlideOverOpen(false);
  }

  // ── Row action builder ────────────────────────────────────────────────────
  function getActions(project: Project): ActionItem[] {
    return [
      { label: 'Voir',      icon: <Eye className="h-3.5 w-3.5" />,     onClick: () => openView(project) },
      { label: 'Modifier',  icon: <Edit className="h-3.5 w-3.5" />,    onClick: () => openEdit(project) },
      { label: 'Dupliquer', icon: <Copy className="h-3.5 w-3.5" />,    onClick: () => handleDuplicate(project) },
      { label: 'Archiver',  icon: <Archive className="h-3.5 w-3.5" />, onClick: () => handleArchive(project), separator: true, disabled: project.status === 'Clôturé' },
      { label: 'Supprimer', icon: <Trash2 className="h-3.5 w-3.5" />,  onClick: () => openDelete(project), variant: 'destructive', separator: true },
    ];
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<Project, any>[]>(() => [
    {
      accessorKey: 'code',
      header: 'CODE',
      meta: { isSticky: true } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'NOM DU PROJET',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[180px] max-w-[280px]">
          <Link
            to={`/projects/${row.original.id}`}
            className="text-[13px] font-semibold text-primary hover:underline leading-snug line-clamp-2"
          >
            {row.original.name}
          </Link>
          <span className="text-[10px] text-muted-foreground">{row.original.sector}</span>
        </div>
      ),
    },
    {
      accessorKey: 'donor',
      header: 'BAILLEUR',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[11px] w-max">{getValue() as string}</Badge>
      ),
    },
    {
      accessorKey: 'country',
      header: 'PAYS',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-foreground">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'manager',
      header: 'CHEF DE PROJET',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
            {row.original.initialesManager}
          </div>
          <span className="text-[12px] text-foreground truncate">{row.original.manager}</span>
        </div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'DÉBUT',
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground">{formatDateShort(getValue() as string)}</span>
      ),
    },
    {
      accessorKey: 'endDate',
      header: 'FIN',
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground">{formatDateShort(getValue() as string)}</span>
      ),
    },
    {
      accessorKey: 'budgetDisplay',
      header: 'BUDGET',
      meta: { align: 'right' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] font-semibold">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUT',
      cell: ({ getValue }) => {
        const s = getValue() as Project['status'];
        return <Badge variant={statusVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    {
      accessorKey: 'progressScore',
      header: 'PROGRESSION',
      cell: ({ getValue }) => {
        const score = getValue() as number;
        return (
          <div className="min-w-[80px] flex flex-col gap-0.5">
            <span className="font-mono text-[10px] text-foreground">{score}%</span>
            <ProgressBar value={score} size="xs" color={progressColor(score)} aria-label={`Progression ${score}%`} />
          </div>
        );
      },
    },
    {
      accessorKey: 'profileScore',
      header: 'PROFIL',
      cell: ({ getValue }) => {
        const score = getValue() as number;
        return (
          <div className="min-w-[80px] flex flex-col gap-0.5">
            <span className="font-mono text-[10px] text-foreground">{score}%</span>
            <ProgressBar value={score} size="xs" color="warning" aria-label={`Profil ${score}%`} />
          </div>
        );
      },
    },
    {
      id: 'sector',
      accessorKey: 'sector',
      header: 'SECTEUR',
      enableHiding: true,
      cell: () => null,
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <ActionsMenu
          actions={getActions(row.original)}
          aria-label={`Actions pour ${row.original.name}`}
        />
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [projects]);

  // ── Header actions ────────────────────────────────────────────────────────
  const headerActions = (
    <>
      <Button
        variant="outline"
        leftIcon={<Download className="h-4 w-4" />}
        onClick={() => { setExportDone(false); setExportModalOpen(true); }}
      >
        Exporter
      </Button>
      <Link
        to="/projects/new"
        className={cn(buttonVariants({ variant: 'default' }), 'gap-2')}
        aria-label="Créer un nouveau projet"
      >
        <Plus className="h-4 w-4" aria-hidden="true" /> Nouveau Projet
      </Link>
    </>
  );

  // ── View toggle ───────────────────────────────────────────────────────────
  const viewToggle = (
    <div
      className="flex items-center rounded-md border border-border overflow-hidden"
      role="group"
      aria-label="Mode d'affichage"
    >
      <button
        type="button"
        aria-pressed={view === 'table'}
        onClick={() => setView('table')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          view === 'table' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label="Vue tableau"
      >
        <List className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Tableau</span>
      </button>
      <button
        type="button"
        aria-pressed={view === 'grid'}
        onClick={() => setView('grid')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          view === 'grid' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label="Vue grille"
      >
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Grille</span>
      </button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ContentLayout>
      <PageHeader
        title="Projets"
        subtitle={`${projects.length} projet${projects.length !== 1 ? 's' : ''} — ${kpis.enBonneVoie} en bonne voie · ${kpis.aRisque} à risque · ${kpis.enRetard} en retard`}
        actions={headerActions}
        className="mb-2"
      />

      {/* KPI Strip */}
      <ProjectKPIs kpis={kpis} />

      {/* View toggle */}
      <div className="flex items-center justify-end">
        {viewToggle}
      </div>

      {/* Table view */}
      {view === 'table' && (
        <DataTable
          columns={columns}
          data={projects}
          searchKey="name"
          searchPlaceholder="Rechercher un projet..."
          filters={projectFilters}
          enableRowSelection
        />
      )}

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              actions={getActions(project)}
            />
          ))}
        </div>
      )}

      {/* ── SlideOver View/Edit ─────────────────────────────────────────── */}
      <ProjectSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        project={selectedProject}
        mode={slideOverMode}
        onSave={handleSave}
      />

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmer la suppression</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong className="text-foreground">{projectToDelete?.name}</strong> ?
              Cette action est irréversible.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Export Modal ────────────────────────────────────────────────── */}
      <Modal open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Exporter les projets</ModalTitle>
            <ModalDescription>
              Sélectionnez le format d'export pour les {projects.length} projets visibles.
            </ModalDescription>
          </ModalHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="export-format">
                Format d'export
              </label>
              <Select
                id="export-format"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              >
                <option value="xlsx">Microsoft Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF (.pdf)</option>
              </Select>
            </div>

            {exportDone && (
              <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-3 py-2 border border-success/20">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Export {exportFormat.toUpperCase()} généré — téléchargement simulé
              </div>
            )}
          </div>

          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="default" onClick={handleExport} disabled={exportDone}>
              <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {exportDone ? 'En cours...' : 'Exporter'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ContentLayout>
  );
}
