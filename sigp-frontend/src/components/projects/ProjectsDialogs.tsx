import { Trash2, Archive } from 'lucide-react';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { Button } from '@/components/ui/forms/Button';
import { type ProjectRow } from '@/lib/projectAdapter';

export interface ProjectsDialogsProps {
  deleteModalOpen: boolean;
  onDeleteModalOpenChange: (open: boolean) => void;
  projectToDelete: ProjectRow | null;
  onConfirmDelete: () => void;
  isDeleting?: boolean;

  archiveModalOpen: boolean;
  onArchiveModalOpenChange: (open: boolean) => void;
  projectToArchive: ProjectRow | null;
  onConfirmArchive: () => void;
  isArchiving?: boolean;
}

export function ProjectsDialogs({
  deleteModalOpen,
  onDeleteModalOpenChange,
  projectToDelete,
  onConfirmDelete,
  isDeleting = false,

  archiveModalOpen,
  onArchiveModalOpenChange,
  projectToArchive,
  onConfirmArchive,
  isArchiving = false,
}: ProjectsDialogsProps) {
  return (
    <>
      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      <Modal open={deleteModalOpen} onOpenChange={onDeleteModalOpenChange}>
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
              <Button variant="outline" disabled={isDeleting}>Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={onConfirmDelete} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {isDeleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Archive Confirmation Modal ──────────────────────────────────── */}
      <Modal open={archiveModalOpen} onOpenChange={onArchiveModalOpenChange}>
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
              <Button variant="outline" disabled={isArchiving}>Annuler</Button>
            </ModalClose>
            <Button variant="default" onClick={onConfirmArchive} disabled={isArchiving}>
              <Archive className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {isArchiving ? 'Archivage…' : 'Archiver'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
