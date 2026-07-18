import { useState, useCallback } from 'react';
import { useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { type UserRow, type CreateUserPayload, type UpdateUserPayload } from '@/lib/userAdapter';
import { type UserFormModalMode } from '@/components/users/UserFormModal';

function extractErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
}

export interface UseUserActionsReturn {
  slideOverOpen: boolean;
  slideOverMode: UserFormModalMode;
  selectedUser: UserRow | null;
  saveError: string | null;
  deleteModalOpen: boolean;
  userToDelete: UserRow | null;
  deleteError: string | null;
  toggleError: string | null;
  isSaving: boolean;
  isDeleting: boolean;
  openNew: () => void;
  openView: (user: UserRow) => void;
  openEdit: (user: UserRow) => void;
  openDelete: (user: UserRow) => void;
  closeSlideOver: (open: boolean) => void;
  closeDeleteModal: (open: boolean) => void;
  dismissToggleError: () => void;
  handleSaveCreate: (payload: CreateUserPayload) => void;
  handleSaveUpdate: (payload: UpdateUserPayload) => void;
  handleDeleteConfirm: () => void;
  handleToggleActive: (user: UserRow) => void;
}

export function useUserActions(): UseUserActionsReturn {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<UserFormModalMode>('view');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Bascule actif/inactif : action directe sans modale — surfacée via une
  // bannière page-level (cf. UsersPage.tsx), pas de champ dédié à réinitialiser
  // à l'ouverture d'une modale.
  const [toggleError, setToggleError] = useState<string | null>(null);

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const openNew = useCallback(() => {
    setSelectedUser(null);
    setSaveError(null);
    setSlideOverMode('new');
    setSlideOverOpen(true);
  }, []);

  const openView = useCallback((user: UserRow) => {
    setSelectedUser(user);
    setSaveError(null);
    setSlideOverMode('view');
    setSlideOverOpen(true);
  }, []);

  const openEdit = useCallback((user: UserRow) => {
    setSelectedUser(user);
    setSaveError(null);
    setSlideOverMode('edit');
    setSlideOverOpen(true);
  }, []);

  const openDelete = useCallback((user: UserRow) => {
    setUserToDelete(user);
    setDeleteError(null);
    setDeleteModalOpen(true);
  }, []);

  const closeSlideOver = useCallback((open: boolean) => {
    setSlideOverOpen(open);
    if (!open) {
      setSelectedUser(null);
      setSaveError(null);
    }
  }, []);

  const closeDeleteModal = useCallback((open: boolean) => {
    setDeleteModalOpen(open);
    if (!open) {
      setUserToDelete(null);
      setDeleteError(null);
    }
  }, []);

  const dismissToggleError = useCallback(() => setToggleError(null), []);

  const handleSaveCreate = useCallback(
    (payload: CreateUserPayload) => {
      setSaveError(null);
      createMutation.mutate(payload, {
        onSuccess: () => {
          setSlideOverOpen(false);
          setSelectedUser(null);
        },
        onError: (err) => setSaveError(extractErrorMessage(err)),
      });
    },
    [createMutation]
  );

  const handleSaveUpdate = useCallback(
    (payload: UpdateUserPayload) => {
      if (!selectedUser) return;
      setSaveError(null);
      updateMutation.mutate(
        { id: selectedUser.id, data: payload },
        {
          onSuccess: () => {
            setSlideOverOpen(false);
            setSelectedUser(null);
          },
          onError: (err) => setSaveError(extractErrorMessage(err)),
        }
      );
    },
    [selectedUser, updateMutation]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!userToDelete) return;
    setDeleteError(null);
    deleteMutation.mutate(userToDelete.id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setUserToDelete(null);
      },
      onError: (err) => setDeleteError(extractErrorMessage(err)),
    });
  }, [userToDelete, deleteMutation]);

  const handleToggleActive = useCallback(
    (user: UserRow) => {
      setToggleError(null);
      updateMutation.mutate(
        { id: user.id, data: { actif: !user.actif } },
        { onError: (err) => setToggleError(extractErrorMessage(err)) }
      );
    },
    [updateMutation]
  );

  return {
    slideOverOpen,
    slideOverMode,
    selectedUser,
    saveError,
    deleteModalOpen,
    userToDelete,
    deleteError,
    toggleError,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
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
  };
}
