import { useCallback, useMemo } from 'react';
import { Eye, Edit, Ban, CheckCircle2 } from 'lucide-react';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { OrganisationKPIs } from '@/components/organisations/OrganisationKPIs';
import { OrganisationsToolbar } from '@/components/organisations/OrganisationsToolbar';
import { OrganisationsDialogs } from '@/components/organisations/OrganisationsDialogs';
import { useOrganisationsList } from '@/hooks/useOrganisationsAdmin';
import { useOrganisationActions } from '@/hooks/useOrganisationActions';
import { getOrganisationColumns, organisationFilters } from '@/utils/organisationColumns';
import { computeOrganisationsKPIs, type OrganisationRow } from '@/lib/organisationAdapter';
import { type ActionItem } from '@/components/projects/ActionsMenu';

export default function OrganisationsPage() {
  const { data: organisations, isLoading, isError, error } = useOrganisationsList();

  const kpis = useMemo(() => computeOrganisationsKPIs(organisations ?? []), [organisations]);

  const {
    slideOverOpen,
    slideOverMode,
    selectedOrganisation,
    suspendModalOpen,
    organisationToToggle,
    isSaving,
    isToggling,
    openNew,
    openView,
    openEdit,
    openSuspendToggle,
    closeSlideOver,
    closeSuspendModal,
    handleSaveCreate,
    handleSaveUpdate,
    handleConfirmSuspendToggle,
  } = useOrganisationActions();

  const getActions = useCallback(
    (org: OrganisationRow): ActionItem[] => [
      {
        label: 'Consulter le détail',
        icon: <Eye className="h-3.5 w-3.5" />,
        onClick: () => openView(org),
      },
      {
        label: "Modifier l'organisation",
        icon: <Edit className="h-3.5 w-3.5" />,
        onClick: () => openEdit(org),
      },
      {
        label: org.statut === 'ACTIVE' ? "Suspendre l'organisation" : 'Réactiver l\'organisation',
        icon: org.statut === 'ACTIVE' ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />,
        onClick: () => openSuspendToggle(org),
        variant: org.statut === 'ACTIVE' ? 'destructive' : 'default',
        separator: true,
      },
    ],
    [openView, openEdit, openSuspendToggle]
  );

  const columns = useMemo(() => getOrganisationColumns(openView, getActions), [openView, getActions]);

  return (
    <ContentLayout>
      <OrganisationsToolbar onOpenNew={openNew} />

      <OrganisationKPIs kpis={kpis} />

      <DataTable
        columns={columns}
        data={organisations ?? []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as { message?: string })?.message ?? 'Erreur de chargement'}
        searchKey="nom"
        searchPlaceholder="Rechercher par nom d'organisation..."
        filters={organisationFilters}
      />

      <OrganisationsDialogs
        slideOverOpen={slideOverOpen}
        onSlideOverOpenChange={closeSlideOver}
        selectedOrganisation={selectedOrganisation}
        slideOverMode={slideOverMode}
        onSaveCreate={handleSaveCreate}
        onSaveUpdate={handleSaveUpdate}
        isSaving={isSaving}
        suspendModalOpen={suspendModalOpen}
        onSuspendModalOpenChange={closeSuspendModal}
        organisationToToggle={organisationToToggle}
        onConfirmSuspendToggle={handleConfirmSuspendToggle}
        isToggling={isToggling}
      />
    </ContentLayout>
  );
}
