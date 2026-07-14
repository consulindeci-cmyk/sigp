import { Trash2 } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from '@/components/ui/overlays/Modal';
import { Button } from '@/components/ui/forms/Button';
import { UserSlideOver, type UserSlideOverMode } from '@/components/users/UserSlideOver';
import { type UserRow, type CreateUserPayload, type UpdateUserPayload } from '@/lib/userAdapter';

export interface UsersDialogsProps {
  slideOverOpen: boolean;
  onSlideOverOpenChange: (open: boolean) => void;
  selectedUser: UserRow | null;
  slideOverMode: UserSlideOverMode;
  onSaveCreate: (data: CreateUserPayload) => void;
  onSaveUpdate: (data: UpdateUserPayload) => void;
  isSaving: boolean;

  deleteModalOpen: boolean;
  onDeleteModalOpenChange: (open: boolean) => void;
  userToDelete: UserRow | null;
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

export function UsersDialogs({
  slideOverOpen,
  onSlideOverOpenChange,
  selectedUser,
  slideOverMode,
  onSaveCreate,
  onSaveUpdate,
  isSaving,

  deleteModalOpen,
  onDeleteModalOpenChange,
  userToDelete,
  onConfirmDelete,
  isDeleting,
}: UsersDialogsProps) {
  return (
    <>
      <UserSlideOver
        open={slideOverOpen}
        onOpenChange={onSlideOverOpenChange}
        user={selectedUser}
        mode={slideOverMode}
        onSaveCreate={onSaveCreate}
        onSaveUpdate={onSaveUpdate}
        isSaving={isSaving}
      />

      <Modal open={deleteModalOpen} onOpenChange={onDeleteModalOpenChange}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmer la suppression</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur{' '}
              <strong className="text-foreground">{userToDelete?.fullName}</strong> ({userToDelete?.email})
              . Cette action est irréversible dans l&apos;interface.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Annuler
              </Button>
            </ModalClose>
            <Button
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
