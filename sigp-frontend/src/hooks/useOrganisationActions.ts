import { useState, useCallback } from 'react';
import {
  useCreateOrganisationAdmin,
  useUpdateOrganisationAdmin,
} from '@/hooks/useOrganisationsAdmin';
import {
  type OrganisationRow,
  type CreateOrganisationAdminPayload,
  type UpdateOrganisationAdminPayload,
} from '@/lib/organisationAdapter';
import { type OrganisationFormModalMode } from '@/components/organisations/OrganisationFormModal';

export interface UseOrganisationActionsReturn {
  slideOverOpen: boolean;
  slideOverMode: OrganisationFormModalMode;
  selectedOrganisation: OrganisationRow | null;
  suspendModalOpen: boolean;
  organisationToToggle: OrganisationRow | null;
  isSaving: boolean;
  isToggling: boolean;
  openNew: () => void;
  openView: (org: OrganisationRow) => void;
  openEdit: (org: OrganisationRow) => void;
  openSuspendToggle: (org: OrganisationRow) => void;
  closeSlideOver: (open: boolean) => void;
  closeSuspendModal: (open: boolean) => void;
  handleSaveCreate: (payload: CreateOrganisationAdminPayload) => void;
  handleSaveUpdate: (payload: Omit<UpdateOrganisationAdminPayload, 'organisationId'>) => void;
  handleConfirmSuspendToggle: () => void;
}

export function useOrganisationActions(): UseOrganisationActionsReturn {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<OrganisationFormModalMode>('view');
  const [selectedOrganisation, setSelectedOrganisation] = useState<OrganisationRow | null>(null);

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [organisationToToggle, setOrganisationToToggle] = useState<OrganisationRow | null>(null);

  const createMutation = useCreateOrganisationAdmin();
  const updateMutation = useUpdateOrganisationAdmin();

  const openNew = useCallback(() => {
    setSelectedOrganisation(null);
    setSlideOverMode('new');
    setSlideOverOpen(true);
  }, []);

  const openView = useCallback((org: OrganisationRow) => {
    setSelectedOrganisation(org);
    setSlideOverMode('view');
    setSlideOverOpen(true);
  }, []);

  const openEdit = useCallback((org: OrganisationRow) => {
    setSelectedOrganisation(org);
    setSlideOverMode('edit');
    setSlideOverOpen(true);
  }, []);

  const openSuspendToggle = useCallback((org: OrganisationRow) => {
    setOrganisationToToggle(org);
    setSuspendModalOpen(true);
  }, []);

  const closeSlideOver = useCallback((open: boolean) => {
    setSlideOverOpen(open);
    if (!open) setSelectedOrganisation(null);
  }, []);

  const closeSuspendModal = useCallback((open: boolean) => {
    setSuspendModalOpen(open);
    if (!open) setOrganisationToToggle(null);
  }, []);

  const handleSaveCreate = useCallback(
    (payload: CreateOrganisationAdminPayload) => {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setSlideOverOpen(false);
          setSelectedOrganisation(null);
        },
      });
    },
    [createMutation]
  );

  const handleSaveUpdate = useCallback(
    (payload: Omit<UpdateOrganisationAdminPayload, 'organisationId'>) => {
      if (!selectedOrganisation) return;
      updateMutation.mutate(
        { organisationId: selectedOrganisation.id, ...payload },
        {
          onSuccess: () => {
            setSlideOverOpen(false);
            setSelectedOrganisation(null);
          },
        }
      );
    },
    [selectedOrganisation, updateMutation]
  );

  const handleConfirmSuspendToggle = useCallback(() => {
    if (!organisationToToggle) return;
    const nextStatut = organisationToToggle.statut === 'SUSPENDUE' ? 'ACTIVE' : 'SUSPENDUE';
    updateMutation.mutate(
      { organisationId: organisationToToggle.id, statut: nextStatut },
      {
        onSuccess: () => {
          setSuspendModalOpen(false);
          setOrganisationToToggle(null);
        },
      }
    );
  }, [organisationToToggle, updateMutation]);

  return {
    slideOverOpen,
    slideOverMode,
    selectedOrganisation,
    suspendModalOpen,
    organisationToToggle,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isToggling: updateMutation.isPending,
    openNew,
    openView,
    openEdit,
    openSuspendToggle,
    closeSlideOver,
    closeSuspendModal,
    handleSaveCreate,
    handleSaveUpdate,
    handleConfirmSuspendToggle,
  };
}
