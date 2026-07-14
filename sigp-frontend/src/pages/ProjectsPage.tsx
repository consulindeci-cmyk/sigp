import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ColumnDef, PaginationState, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '@/hooks/useDashboard';
import {
  Download, Plus, Eye, Edit, Copy, Archive, Trash2,
  LayoutGrid, List,
} from 'lucide-react';
import api from '@/lib/axios';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/forms/Button';
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

// Types & utilities from mocks (mock data not used — API only)
import {
  uniqueOptions,
  type Project,
  type ProjectsKPIs,
} from '@/mocks/projectsMocks';
import { useProjects, projectKeys } from '@/hooks/useProjects';
import { adaptProjectDto, type ProjectApiDto } from '@/lib/projectAdapter';

// ─────────────────────────────────────────────────────────────────────────────
// Adapter: maps backend ProjectResponseDto → frontend ProjectRow shape
// ─────────────────────────────────────────────────────────────────────────────

type ProjectRow = Project & { programmeId?: string; rawManagerId?: string | null };

type CreateProjectPayload = {
  code?: string; nom?: string; description?: string;
  bailleurPrincipal?: string; secteur?: string; pays?: string;
  managerId?: string; dateDebut?: string; dateFinPrevue?: string;
  budgetTotal?: number; devise?: string; statut?: string;
  programmeId?: string;
};

function adaptToRow(raw: ProjectApiDto): ProjectRow {
  return {
    ...adaptProjectDto(raw),
    programmeId: raw.programmeId ?? undefined,
    rawManagerId: raw.managerId,
  };
}

function toCreatePayload(data: Partial<Project>): CreateProjectPayload {
  return {
    code: data.code,
    nom: data.name,
    description: data.description,
    bailleurPrincipal: data.donor,
    secteur: data.sector,
    pays: data.country,
    dateDebut: data.startDate || undefined,
    dateFinPrevue: data.endDate || undefined,
    budgetTotal: data.budgetTotal,
    devise: data.devise,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Static filter options (status values never change)
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'En bonne voie', value: 'En bonne voie' },
  { label: 'À risque',      value: 'À risque'       },
  { label: 'Clôturé',      value: 'Clôturé'        },
  { label: 'En préparation', value: 'En préparation' },
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

export default function ProjectsPage() {
  const qc = useQueryClient();

  // ── API data ──────────────────────────────────────────────────────────────
  const { data: programmesData } = useQuery({
    queryKey: ['programmes'],
    queryFn: async () => {
      const { data } = await api.get('/programmes');
      // The API returns a paginated response: { data: { data: [...], meta: {} } }
      // We must extract the inner data array correctly.
      const list = data?.data?.data ?? data?.data ?? data ?? [];
      return list as Array<{ id: string }>;
    },
  });
  const defaultProgrammeId: string | undefined = programmesData?.[0]?.id;

  // ── Controlled Table States (Server-Side Pagination, Sorting, Search, Filtering) ──
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<ColumnFiltersState>([]);

  const handleSortingChange = (updater: any) => {
    setSortingState(updater);
    setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleColumnFiltersChange = (updater: any) => {
    setColumnFiltersState(updater);
    setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const queryParams = useMemo(() => {
    const searchFilter = columnFiltersState.find((f) => f.id === 'search');
    const statusFilter = columnFiltersState.find((f) => f.id === 'status');
    const donorFilter = columnFiltersState.find((f) => f.id === 'donor');
    const sectorFilter = columnFiltersState.find((f) => f.id === 'sector');
    const countryFilter = columnFiltersState.find((f) => f.id === 'country');

    const filters: Record<string, any> = {};
    if (statusFilter?.value) filters.status = statusFilter.value;
    if (donorFilter?.value) filters.donor = donorFilter.value;
    if (sectorFilter?.value) filters.sector = sectorFilter.value;
    if (countryFilter?.value) filters.country = countryFilter.value;

    const firstSort = sortingState[0];

    return {
      page: paginationState.pageIndex + 1,
      limit: paginationState.pageSize,
      search: searchFilter?.value ? String(searchFilter.value) : undefined,
      sortBy: firstSort?.id,
      sortOrder: firstSort ? (firstSort.desc ? ('desc' as const) : ('asc' as const)) : undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };
  }, [paginationState, sortingState, columnFiltersState]);

  const {
    data: apiData,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
    error: projectsError,
  } = useProjects(queryParams);

  const projects = useMemo<ProjectRow[]>(
    () => (apiData?.data ?? []).map(adaptToRow),
    [apiData],
  );

  const pageCount = apiData?.meta?.totalPages ?? 1;
  const rowCount = apiData?.meta?.total ?? projects.length;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createProject = useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const { data } = await api.post('/projects', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CreateProjectPayload }) => {
      const { data } = await api.patch(`/projects/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/projects/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });

  const [view, setView] = useState<ViewMode>('grid');

  // SlideOver
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<ProjectSlideOverMode>('view');
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Archive modal
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);

  // Export modal
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // ── Backend data for KPIs ───────────────────────────────────────────────
  const { data: dashboardData } = useDashboard();

  // ── Dynamic KPIs ──────────────────────────────────────────────────────────
  const kpis = useMemo<ProjectsKPIs>(() => {
    const apiD = dashboardData as any;
    return {
      total: apiD?.projets?.total ?? 0,
      enBonneVoie: apiD?.projets?.actifs ?? 0, // Approx for now
      aRisque: apiD?.risques?.eleves ?? 0, // Using risk high count as proxy for at risk
      enRetard: apiD?.projets?.suspendus ?? 0,
      clotured: apiD?.projets?.termines ?? 0,
      budgetPortefeuille: ((apiD?.finances?.budgetTotal ?? 0) / 1_000_000).toFixed(1).replace('.', ',') + ' M FCFA',
    };
  }, [dashboardData]);

  // Dynamic filter options — update automatically when projects array changes
  const projectFilters = useMemo<DataTableFilter[]>(() => [
    { id: 'status',  title: 'Statut',   options: STATUS_OPTIONS },
    { id: 'donor',   title: 'Bailleur', options: uniqueOptions(projects, 'donor') },
    { id: 'sector',  title: 'Secteur',  options: uniqueOptions(projects, 'sector') },
    { id: 'country', title: 'Pays',     options: uniqueOptions(projects, 'country') },
  ], [projects]);

  // ── Actions ───────────────────────────────────────────────────────────────
  function openNew() {
    setSelectedProject(null);
    setSlideOverMode('new');
    setSlideOverOpen(true);
  }

  function openView(project: ProjectRow) {
    setSelectedProject(project);
    setSlideOverMode('view');
    setSlideOverOpen(true);
  }

  function openEdit(project: ProjectRow) {
    setSelectedProject(project);
    setSlideOverMode('edit');
    setSlideOverOpen(true);
  }

  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave(data: Partial<Project>) {
    const payload = toCreatePayload(data);
    setSaveError(null);
    try {
      if (slideOverMode === 'new') {
        await createProject.mutateAsync({ ...payload, programmeId: defaultProgrammeId });
      } else if (slideOverMode === 'edit' && selectedProject) {
        await updateProject.mutateAsync({ id: selectedProject.id, payload });
      }
      setSlideOverOpen(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: { message?: string } } }; message?: string };
      const msg =
        axiosErr?.response?.data?.error?.message ||
        axiosErr?.response?.data?.message ||
        axiosErr?.message ||
        'Une erreur est survenue. Veuillez réessayer.';
      setSaveError(msg);
    }
  }

  function handleDuplicate(project: ProjectRow) {
    createProject.mutate({
      code: `${project.code}-COPY`,
      nom: `${project.name} (Copie)`,
      description: project.description,
      bailleurPrincipal: project.donor,
      secteur: project.sector,
      pays: project.country,
      managerId: project.rawManagerId ?? undefined,
      dateDebut: project.startDate || undefined,
      dateFinPrevue: project.endDate || undefined,
      budgetTotal: project.budgetTotal,
      devise: project.devise,
      programmeId: project.programmeId,
    });
  }

  function openArchive(project: ProjectRow) {
    setProjectToArchive(project);
    setArchiveModalOpen(true);
  }

  function handleArchiveConfirm() {
    if (!projectToArchive) return;
    updateProject.mutate(
      { id: projectToArchive.id, payload: { statut: 'CLOTURE' } },
      { onSuccess: () => { setArchiveModalOpen(false); setProjectToArchive(null); } },
    );
  }

  function openDelete(project: ProjectRow) {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  }

  function handleDeleteConfirm() {
    if (!projectToDelete) return;
    deleteProject.mutate(
      projectToDelete.id,
      { onSuccess: () => { setDeleteModalOpen(false); setProjectToDelete(null); } },
    );
  }

  function handleExport() {
    const headers = [
      'Code', 'Nom', 'Bailleur', 'Secteur', 'Pays', 'Chef de Projet',
      'Statut', 'Budget', 'Devise', 'Date Début', 'Date Fin',
      'Progression (%)', 'Taux Décaissement (%)',
    ];
    const rows = projects.map((p) => [
      p.code, p.name, p.donor, p.sector, p.country, p.manager,
      p.status, String(p.budgetTotal), p.devise, p.startDate, p.endDate,
      String(p.progressScore), String(p.tauxDecaissement),
    ]);
    const csv = '﻿' + [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projets-gpd-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
  }

  // ── Row action builder ────────────────────────────────────────────────────
  function getActions(project: ProjectRow): ActionItem[] {
    return [
      { label: 'Voir',      icon: <Eye     className="h-3.5 w-3.5" />, onClick: () => openView(project) },
      { label: 'Modifier',  icon: <Edit    className="h-3.5 w-3.5" />, onClick: () => openEdit(project) },
      { label: 'Dupliquer', icon: <Copy    className="h-3.5 w-3.5" />, onClick: () => handleDuplicate(project) },
      {
        label: 'Archiver', icon: <Archive className="h-3.5 w-3.5" />,
        onClick: () => openArchive(project),
        separator: true,
        disabled: project.status === 'Clôturé',
      },
      {
        label: 'Supprimer', icon: <Trash2 className="h-3.5 w-3.5" />,
        onClick: () => openDelete(project),
        variant: 'destructive', separator: true,
      },
    ];
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<ProjectRow, any>[]>(() => [
    {
      accessorKey: 'code',
      header: 'CODE',
      meta: { isSticky: true },
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
      meta: { align: 'right' },
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
    // Hidden column for multi-field search (name + code + donor + sector + country + manager)
    {
      id: 'search',
      accessorFn: (row) =>
        [row.name, row.code, row.donor, row.sector, row.country, row.manager].join(' '),
      enableHiding: true,
      header: '',
      cell: () => null,
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' },
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
        onClick={() => setExportModalOpen(true)}
      >
        Exporter
      </Button>
      <Button
        variant="default"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={openNew}
        aria-label="Créer un nouveau projet"
      >
        Nouveau Projet
      </Button>
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
          view === 'table'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
          view === 'grid'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
        subtitle={`${apiData?.meta?.total ?? projects.length} projet${(apiData?.meta?.total ?? projects.length) !== 1 ? 's' : ''} — ${kpis.enBonneVoie} en bonne voie · ${kpis.aRisque} à risque · ${kpis.enRetard} en retard`}
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
          isLoading={isProjectsLoading}
          isError={isProjectsError}
          errorMessage={(projectsError as any)?.message ?? 'Erreur lors du chargement des projets'}
          searchKey="search"
          searchPlaceholder="Rechercher un projet, code, description..."
          filters={projectFilters}
          enableRowSelection
          manualPagination
          pageCount={pageCount}
          rowCount={rowCount}
          pagination={paginationState}
          onPaginationChange={setPaginationState}
          manualSorting
          sorting={sortingState}
          onSortingChange={handleSortingChange}
          manualFiltering
          columnFilters={columnFiltersState}
          onColumnFiltersChange={handleColumnFiltersChange}
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

      {/* ── SlideOver View / Edit / New ─────────────────────────────────── */}
      <ProjectSlideOver
        open={slideOverOpen}
        onOpenChange={(v) => { setSlideOverOpen(v); if (!v) setSaveError(null); }}
        project={selectedProject}
        mode={slideOverMode}
        onSave={handleSave}
        saveError={saveError}
        isSaving={createProject.isPending || updateProject.isPending}
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

      {/* ── Archive Confirmation Modal ──────────────────────────────────── */}
      <Modal open={archiveModalOpen} onOpenChange={setArchiveModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmer l'archivage</ModalTitle>
            <ModalDescription>
              Voulez-vous archiver{' '}
              <strong className="text-foreground">{projectToArchive?.name}</strong> ?
              Le statut passera à <em>Clôturé</em>.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="default" onClick={handleArchiveConfirm}>
              <Archive className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Archiver
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
              {projects.length} projet{projects.length !== 1 ? 's' : ''} seront exportés en CSV
              (compatible Excel).
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="default" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Télécharger CSV
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ContentLayout>
  );
}
