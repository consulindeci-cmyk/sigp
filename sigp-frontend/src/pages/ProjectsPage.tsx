import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  type PaginationState,
  type SortingState,
  type ColumnFiltersState,
  type Updater,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { Eye, Edit, Copy, Archive, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { type DataTableFilter } from '@/components/ui/data-table/types';
import { useOrganisationsList } from '@/hooks/useOrganisationsAdmin';

// Refactored modular components per Tâche 5
import { ProjectsToolbar } from '@/components/projects/ProjectsToolbar';
import { ProjectKPIs } from '@/components/projects/ProjectKPIs';
import { ProjectsGrid } from '@/components/projects/ProjectsGrid';
import { ProjectsDialogs } from '@/components/projects/ProjectsDialogs';
import { ProjectSlideOver, type ProjectSlideOverMode } from '@/components/projects/ProjectSlideOver';
import { type ActionItem } from '@/components/projects/ActionsMenu';
import { getProjectColumns } from '@/components/projects/projectColumns';
import { exportAllProjectsToCSV } from '@/components/projects/projectExport';

// Hooks & Unified Adapters (API only — no mock imports)
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useProjectsReferenceOptions,
  useProjectsKPIs,
} from '@/hooks/useProjects';
import { adaptToRow, type ProjectRow, type Project, type UpdateProjectPayload, type ProjectsKPIs } from '@/lib/projectAdapter';

// ── Export error state ─────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { label: 'En bonne voie', value: 'En bonne voie' },
  { label: 'À risque',      value: 'À risque'       },
  { label: 'Clôturé',      value: 'Clôturé'        },
  { label: 'En préparation', value: 'En préparation' },
  { label: 'Annulé',        value: 'Annulé'         },
];

export default function ProjectsPage() {
  // ── Super Admin : vue plateforme, lecture seule + filtre par organisation ──
  const isSuperAdmin = useAuthStore(s => s.user?.role === 'SUPER_ADMIN');
  const { data: organisationsForFilter } = useOrganisationsList(isSuperAdmin);

  // ── API data & Default Programme ──────────────────────────────────────────
  const { data: programmesData } = useQuery({
    queryKey: ['programmes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programmes').select('id');
      if (error) throw error;
      return data as Array<{ id: string }>;
    },
    staleTime: 5 * 60 * 1000,
  });
  const defaultProgrammeId: string | undefined = programmesData?.[0]?.id;

  // ── Controlled Table States (Server-Side Pagination, Sorting, Search, Filtering) ──
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<ColumnFiltersState>([]);
  const [view, setView] = useState<'table' | 'grid'>('grid');

  // Typed updaters — élimination des any résiduels (P-07)
  const handleSortingChange = useCallback((updater: Updater<SortingState>) => {
    setSortingState(prev => typeof updater === 'function' ? updater(prev) : updater);
    setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleColumnFiltersChange = useCallback((updater: Updater<ColumnFiltersState>) => {
    setColumnFiltersState(prev => typeof updater === 'function' ? updater(prev) : updater);
    setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const queryParams = useMemo(() => {
    const searchFilter = columnFiltersState.find((f) => f.id === 'search');
    const statusFilter = columnFiltersState.find((f) => f.id === 'status');
    const donorFilter = columnFiltersState.find((f) => f.id === 'donor');
    const sectorFilter = columnFiltersState.find((f) => f.id === 'sector');
    const countryFilter = columnFiltersState.find((f) => f.id === 'country');

    const filters: Record<string, string | number | undefined> = {};
    if (statusFilter?.value) filters.status = String(statusFilter.value);
    if (donorFilter?.value) filters.donor = String(donorFilter.value);
    if (sectorFilter?.value) filters.sector = String(sectorFilter.value);
    if (countryFilter?.value) filters.country = String(countryFilter.value);

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

  // ── Data Fetching via dedicated Hooks per Tâche 6 ──────────────────────────
  const {
    data: apiData,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
    error: projectsError,
  } = useProjects({ ...queryParams, includeOrganisation: isSuperAdmin });

  const { data: refOptions } = useProjectsReferenceOptions();
  const { data: exactKpis } = useProjectsKPIs(queryParams.filters);

  const projects = useMemo<ProjectRow[]>(
    () => (apiData?.data ?? []).map(adaptToRow),
    [apiData],
  );

  const pageCount = apiData?.meta?.totalPages ?? 1;
  const rowCount = apiData?.meta?.total ?? projects.length;

  // ── Mutations via dedicated hooks per Tâche 6 ──────────────────────────────
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  // ── UI Modals State ────────────────────────────────────────────────────────
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<ProjectSlideOverMode>('view');
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectRow | null>(null);

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<ProjectRow | null>(null);

  const [isExporting, setIsExporting] = useState(false);

  // ── Exact KPIs without proxy metrics per Tâche 8 ───────────────────────────
  const kpis = useMemo<ProjectsKPIs>(() => ({
    total: exactKpis?.total ?? rowCount,
    enBonneVoie: exactKpis?.enBonneVoie ?? 0,
    aRisque: exactKpis?.aRisque ?? 0,
    enRetard: exactKpis?.enRetard ?? 0,
    clotured: exactKpis?.clotured ?? 0,
    budgetPortefeuille: exactKpis?.budgetPortefeuille ?? '0 XOF',
  }), [exactKpis, rowCount]);

  // Dynamic filter options across entire database per Tâche 10 & 11
  const projectFilters = useMemo<DataTableFilter[]>(() => {
    const filters: DataTableFilter[] = [
      { id: 'status',  title: 'Statut',   options: STATUS_OPTIONS },
      { id: 'donor',   title: 'Bailleur', options: (refOptions?.donors ?? []).map((d) => ({ label: d, value: d })) },
      { id: 'sector',  title: 'Secteur',  options: (refOptions?.sectors ?? []).map((s) => ({ label: s, value: s })) },
      { id: 'country', title: 'Pays',     options: (refOptions?.countries ?? []).map((c) => ({ label: c, value: c })) },
    ];
    if (isSuperAdmin) {
      filters.push({
        id: 'organisation',
        title: 'Organisation',
        options: (organisationsForFilter ?? []).map((o) => ({ label: o.nom, value: o.id })),
      });
    }
    return filters;
  }, [refOptions, isSuperAdmin, organisationsForFilter]);

  // ── Actions ───────────────────────────────────────────────────────────────
  function openNew() {
    // Supervision Super Admin : pas de création de projet, même via le
    // raccourci ?new=1 (cf. effect ci-dessous).
    if (isSuperAdmin) return;
    setSelectedProject(null);
    setSlideOverMode('new');
    setSlideOverOpen(true);
  }

  // Ouverture directe depuis le raccourci "Nouveau projet" du Dashboard (?new=1)
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openNew();
      setSearchParams(prev => { prev.delete('new'); return prev; }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function handleSave(data: Partial<Project>) {
    setSaveError(null);
    try {
      if (slideOverMode === 'new') {
        await createProjectMutation.mutateAsync({
          code: data.code,
          nom: data.name,
          description: data.description,
          bailleurPrincipal: data.donor,
          secteur: data.sector,
          pays: data.country,
          managerId: data.managerId || undefined,
          dateDebut: data.startDate || undefined,
          dateFinPrevue: data.endDate || undefined,
          dateFinEffective: data.dateFinEffective || undefined,
          dateClotureEffective: data.dateClotureEffective || undefined,
          budgetTotal: data.budgetTotal,
          devise: data.devise,
          statut: data.statut,
          programmeId: defaultProgrammeId,
        });
      } else if (slideOverMode === 'edit' && selectedProject) {
        // Le champ `code` est intentionnellement absent du payload PATCH (immuable côté backend)
        const payload: UpdateProjectPayload = {
          nom: data.name,
          description: data.description,
          bailleurPrincipal: data.donor,
          secteur: data.sector,
          pays: data.country,
          managerId: data.managerId || undefined,
          dateDebut: data.startDate || undefined,
          dateFinPrevue: data.endDate || undefined,
          dateFinEffective: data.dateFinEffective || undefined,
          dateClotureEffective: data.dateClotureEffective || undefined,
          budgetTotal: data.budgetTotal,
          devise: data.devise,
          statut: data.statut,
        };
        await updateProjectMutation.mutateAsync({
          id: selectedProject.id,
          payload,
        });
      }
      setSlideOverOpen(false);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string; error?: { message?: string } } }; message?: string };
      const msg =
        errObj?.response?.data?.error?.message ||
        errObj?.response?.data?.message ||
        errObj?.message ||
        'Une erreur est survenue. Veuillez réessayer.';
      setSaveError(msg);
    }
  }

  function handleDuplicate(project: ProjectRow) {
    createProjectMutation.mutate({
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
      programmeId: project.programmeId ?? defaultProgrammeId,
    });
  }

  function openArchive(project: ProjectRow) {
    setProjectToArchive(project);
    setArchiveModalOpen(true);
  }

  function handleArchiveConfirm() {
    if (!projectToArchive) return;
    updateProjectMutation.mutate(
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
    deleteProjectMutation.mutate(
      projectToDelete.id,
      { onSuccess: () => { setDeleteModalOpen(false); setProjectToDelete(null); } },
    );
  }

  async function handleExport() {
    setIsExporting(true);
    setExportError(null);
    try {
      await exportAllProjectsToCSV({
        search: queryParams.search,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
        filters: queryParams.filters,
      });
    } catch (e: unknown) {
      const errObj = e as { message?: string };
      setExportError(errObj?.message ?? 'Échec de l\'export CSV. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  }

  // Memoïsé pour éviter les re-renders des cartes (P-06)
  // SUPER_ADMIN : page de supervision en lecture seule — la création/édition
  // de projet reste une responsabilité org_admin (cf. requireRole resserré
  // côté Edge Functions projects-create/update/delete/restore).
  const getActions = useCallback((project: ProjectRow): ActionItem[] => {
    if (isSuperAdmin) {
      return [
        { label: 'Voir', icon: <Eye className="h-3.5 w-3.5" />, onClick: () => openView(project) },
      ];
    }
    return [
      { label: 'Voir',      icon: <Eye     className="h-3.5 w-3.5" />, onClick: () => openView(project) },
      { label: 'Modifier',  icon: <Edit    className="h-3.5 w-3.5" />, onClick: () => openEdit(project) },
      { label: 'Dupliquer', icon: <Copy    className="h-3.5 w-3.5" />, onClick: () => handleDuplicate(project) },
      {
        label: 'Archiver', icon: <Archive className="h-3.5 w-3.5" />,
        onClick: () => openArchive(project),
        separator: true,
        disabled: project.status === 'Clôturé' || project.statut === 'CLOTURE',
      },
      {
        label: 'Supprimer', icon: <Trash2 className="h-3.5 w-3.5" />,
        onClick: () => openDelete(project),
        variant: 'destructive', separator: true,
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  const columns = useMemo(
    () => getProjectColumns(getActions, { showOrganisation: isSuperAdmin }),
    [getActions, isSuperAdmin]
  );

  return (
    <ContentLayout>
      <ProjectsToolbar
        view={view}
        onViewChange={setView}
        onOpenNew={openNew}
        onExport={handleExport}
        isExporting={isExporting}
        canCreate={!isSuperAdmin}
      />

      {/* Affichage de l'erreur d'export CSV (P-11) */}
      {exportError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive flex items-center justify-between"
        >
          <span>{exportError}</span>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="ml-4 text-xs underline opacity-70 hover:opacity-100"
            aria-label="Fermer le message d'erreur"
          >
            Fermer
          </button>
        </div>
      )}

      <ProjectKPIs kpis={kpis} />

      {view === 'table' && (
        <DataTable
          columns={columns}
          data={projects}
          isLoading={isProjectsLoading}
          isError={isProjectsError}
          errorMessage={(projectsError as { message?: string })?.message ?? 'Erreur lors du chargement des projets'}
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

      {view === 'grid' && (
        <ProjectsGrid
          projects={projects}
          isLoading={isProjectsLoading}
          getActions={getActions}
          pageIndex={paginationState.pageIndex}
          pageSize={paginationState.pageSize}
          pageCount={pageCount}
          rowCount={rowCount}
          onPageChange={setPaginationState}
        />
      )}

      <ProjectSlideOver
        open={slideOverOpen}
        onOpenChange={(v) => { setSlideOverOpen(v); if (!v) setSaveError(null); }}
        project={selectedProject}
        mode={slideOverMode}
        onSave={handleSave}
        saveError={saveError}
        isSaving={createProjectMutation.isPending || updateProjectMutation.isPending}
      />

      <ProjectsDialogs
        deleteModalOpen={deleteModalOpen}
        onDeleteModalOpenChange={setDeleteModalOpen}
        projectToDelete={projectToDelete}
        onConfirmDelete={handleDeleteConfirm}
        isDeleting={deleteProjectMutation.isPending}
        archiveModalOpen={archiveModalOpen}
        onArchiveModalOpenChange={setArchiveModalOpen}
        projectToArchive={projectToArchive}
        onConfirmArchive={handleArchiveConfirm}
        isArchiving={updateProjectMutation.isPending}
      />
    </ContentLayout>
  );
}
