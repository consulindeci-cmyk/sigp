import { useCallback, useMemo } from 'react';
import { Eye, Edit, UserCheck, UserX, Trash2 } from 'lucide-react';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { UserKPIs } from '@/components/users/UserKPIs';
import { UsersToolbar } from '@/components/users/UsersToolbar';
import { UsersDialogs } from '@/components/users/UsersDialogs';
import { useUsersTable } from '@/hooks/useUsersTable';
import { useUserActions } from '@/hooks/useUserActions';
import { useUsersKPIs } from '@/hooks/useUsers';
import { useOrganisationsList } from '@/hooks/useOrganisationsAdmin';
import { useAuthStore } from '@/stores/authStore';
import { getUserColumns, userFilters } from '@/utils/userColumns';
import { type UserRow } from '@/lib/userAdapter';
import { type DataTableFilter } from '@/components/ui/data-table/types';
import { type ActionItem } from '@/components/projects/ActionsMenu';

export default function UsersPage() {
  // SUPER_ADMIN : vue plateforme, filtre + colonne Organisation.
  const isSuperAdmin = useAuthStore(s => s.user?.role === 'SUPER_ADMIN');
  const { data: organisationsForFilter } = useOrganisationsList(isSuperAdmin);

  // Hook d'état du tableau (pagination, tri, filtres et requête API)
  const {
    users,
    pageCount,
    rowCount,
    isLoading,
    isError,
    error,
    paginationState,
    setPaginationState,
    sortingState,
    setSortingState,
    columnFiltersState,
    setColumnFiltersState,
  } = useUsersTable({ includeOrganisation: isSuperAdmin });

  // Hook des KPIs en temps réel
  const { data: kpisData } = useUsersKPIs();

  // Hook des modales, du SlideOver et des callbacks de mutations
  const {
    slideOverOpen,
    slideOverMode,
    selectedUser,
    deleteModalOpen,
    userToDelete,
    isSaving,
    isDeleting,
    openNew,
    openView,
    openEdit,
    openDelete,
    closeSlideOver,
    closeDeleteModal,
    handleSaveCreate,
    handleSaveUpdate,
    handleDeleteConfirm,
    handleToggleActive,
  } = useUserActions();

  // Actions stables par ligne
  const getActions = useCallback(
    (user: UserRow): ActionItem[] => [
      {
        label: 'Consulter le profil',
        icon: <Eye className="h-3.5 w-3.5" />,
        onClick: () => openView(user),
      },
      {
        label: 'Modifier les informations',
        icon: <Edit className="h-3.5 w-3.5" />,
        onClick: () => openEdit(user),
      },
      {
        label: user.actif ? 'Désactiver le compte' : 'Activer le compte',
        icon: user.actif ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />,
        onClick: () => handleToggleActive(user),
        variant: 'default',
        separator: true,
      },
      {
        label: 'Supprimer définitivement',
        icon: <Trash2 className="h-3.5 w-3.5" />,
        onClick: () => openDelete(user),
        variant: 'destructive',
        separator: true,
      },
    ],
    [openView, openEdit, handleToggleActive, openDelete]
  );

  // Colonnes mémorisées et indépendantes des données
  const columns = useMemo(
    () => getUserColumns(openView, getActions, { showOrganisation: isSuperAdmin }),
    [openView, getActions, isSuperAdmin]
  );

  // Filtre Organisation dynamique — visible uniquement pour le SUPER_ADMIN.
  const filters = useMemo<DataTableFilter[]>(() => {
    if (!isSuperAdmin) return userFilters;
    return [
      ...userFilters,
      {
        id: 'organisation',
        title: 'Organisation',
        options: (organisationsForFilter ?? []).map((o) => ({ label: o.nom, value: o.id })),
      },
    ];
  }, [isSuperAdmin, organisationsForFilter]);

  return (
    <ContentLayout>
      <UsersToolbar onOpenNew={openNew} />

      <UserKPIs kpis={kpisData} />

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as { message?: string })?.message ?? 'Erreur de chargement'}
        searchKey="search"
        searchPlaceholder="Rechercher par nom, email..."
        filters={filters}
        manualPagination
        pageCount={pageCount}
        rowCount={rowCount}
        pagination={paginationState}
        onPaginationChange={setPaginationState}
        manualSorting
        sorting={sortingState}
        onSortingChange={setSortingState}
        manualFiltering
        columnFilters={columnFiltersState}
        onColumnFiltersChange={setColumnFiltersState}
      />

      <UsersDialogs
        slideOverOpen={slideOverOpen}
        onSlideOverOpenChange={closeSlideOver}
        selectedUser={selectedUser}
        slideOverMode={slideOverMode}
        onSaveCreate={handleSaveCreate}
        onSaveUpdate={handleSaveUpdate}
        isSaving={isSaving}
        deleteModalOpen={deleteModalOpen}
        onDeleteModalOpenChange={closeDeleteModal}
        userToDelete={userToDelete}
        onConfirmDelete={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </ContentLayout>
  );
}
