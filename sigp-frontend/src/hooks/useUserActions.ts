import { useState, useCallback } from 'react';
import { useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { type UserRow, type CreateUserPayload, type UpdateUserPayload } from '@/lib/userAdapter';
import { type UserFormModalMode } from '@/components/users/UserFormModal';

export interface UseUserActionsReturn {
  slideOverOpen: boolean;
  slideOverMode: UserFormModalMode;
  selectedUser: UserRow | null;
  deleteModalOpen: boolean;
  userToDelete: UserRow | null;
  isSaving: boolean;
  isDeleting: boolean;
  openNew: () => void;
  openView: (user: UserRow) => void;
  openEdit: (user: UserRow) => void;
  openDelete: (user: UserRow) => void;
  closeSlideOver: (open: boolean) => void;
  closeDeleteModal: (open: boolean) => void;
  handleSaveCreate: (payload: CreateUserPayload) => void;
  handleSaveUpdate: (payload: UpdateUserPayload) => void;
  handleDeleteConfirm: () => void;
  handleToggleActive: (user: UserRow) => void;
}

export function useUserActions(): UseUserActionsReturn {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<UserFormModalMode>('view');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const openNew = useCallback(() => {
    setSelectedUser(null);
    setSlideOverMode('new');
    setSlideOverOpen(true);
  }, []);

  const openView = useCallback((user: UserRow) => {
    setSelectedUser(user);
    setSlideOverMode('view');
    setSlideOverOpen(true);
  }, []);

  const openEdit = useCallback((user: UserRow) => {
    setSelectedUser(user);
    setSlideOverMode('edit');
    setSlideOverOpen(true);
  }, []);

  const openDelete = useCallback((user: UserRow) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  }, []);

  const closeSlideOver = useCallback((open: boolean) => {
    setSlideOverOpen(open);
    if (!open) {
      setSelectedUser(null);
    }
  }, []);

  const closeDeleteModal = useCallback((open: boolean) => {
    setDeleteModalOpen(open);
    if (!open) {
      setUserToDelete(null);
    }
  }, []);

  const handleSaveCreate = useCallback(
    (payload: CreateUserPayload) => {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setSlideOverOpen(false);
          setSelectedUser(null);
        },
      });
    },
    [createMutation]
  );

  const handleSaveUpdate = useCallback(
    (payload: UpdateUserPayload) => {
      if (!selectedUser) return;
      updateMutation.mutate(
        { id: selectedUser.id, data: payload },
        {
          onSuccess: () => {
            setSlideOverOpen(false);
            setSelectedUser(null);
          },
        }
      );
    },
    [selectedUser, updateMutation]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!userToDelete) return;
    deleteMutation.mutate(userToDelete.id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setUserToDelete(null);
      },
    });
  }, [userToDelete, deleteMutation]);

  const handleToggleActive = useCallback(
    (user: UserRow) => {
      updateMutation.mutate({
        id: user.id,
        data: { actif: !user.actif },
      });
    },
    [updateMutation]
  );

  return {
    slideOverOpen,
    slideOverMode,
    selectedUser,
    deleteModalOpen,
    userToDelete,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
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
  };
}
