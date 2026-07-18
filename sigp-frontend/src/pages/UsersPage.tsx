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
  // Miroir de requireRole(profile, ['ADMIN', 'SUPER_ADMIN']) sur users-create/
  // update/delete côté serveur — sans ce garde-fou, tout rôle (VIEWER,
  // AUDITEUR, FINANCIER...) voyait un bouton "Nouvel utilisateur" et des
  // actions Modifier/Activer/Supprimer sur chaque ligne, garanties d'échouer
  // en 403 à l'usage.
  const canManageUsers = useAuthStore(s => s.user?.role === 'ADMIN' || s.user?.role === 'SUPER_ADMIN');
  const currentUserId = useAuthStore(s => s.user?.id);

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
    saveError,
    deleteModalOpen,
    userToDelete,
    deleteError,
    toggleError,
    isSaving,
    isDeleting,
    openNew,
    openView,
    openEdit,
    openDelete,
    closeSlideOver,
    closeDeleteModal,
    dismissToggleError,
    handleSaveCreate,
    handleSaveUpdate,
    handleDeleteConfirm,
    handleToggleActive,
  } = useUserActions();

  // Actions stables par ligne — Modifier/Activer/Supprimer réservées à
  // ADMIN/SUPER_ADMIN (miroir des rôles serveur), sauf sur son propre compte.
  const getActions = useCallback(
    (user: UserRow): ActionItem[] => {
      const actions: ActionItem[] = [
        {
          label: 'Consulter le profil',
          icon: <Eye className="h-3.5 w-3.5" />,
          onClick: () => openView(user),
        },
      ];
      if (!canManageUsers && user.id !== currentUserId) return actions;
      actions.push(
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
      );
      return actions;
    },
    [openView, openEdit, handleToggleActive, openDelete, canManageUsers, currentUserId]
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
      <UsersToolbar onOpenNew={openNew} canCreate={canManageUsers} />

      {toggleError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive flex items-center justify-between"
        >
          <span>{toggleError}</span>
          <button
            type="button"
            onClick={dismissToggleError}
            className="ml-4 text-xs underline opacity-70 hover:opacity-100"
            aria-label="Fermer le message d'erreur"
          >
            Fermer
          </button>
        </div>
      )}

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
        saveError={saveError}
        deleteModalOpen={deleteModalOpen}
        onDeleteModalOpenChange={closeDeleteModal}
        userToDelete={userToDelete}
        onConfirmDelete={handleDeleteConfirm}
        isDeleting={isDeleting}
        deleteError={deleteError}
      />
    </ContentLayout>
  );
}
