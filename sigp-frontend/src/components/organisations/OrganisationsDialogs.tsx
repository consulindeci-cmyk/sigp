import { Ban, CheckCircle2 } from 'lucide-react';
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
import {
  OrganisationSlideOver,
  type OrganisationSlideOverMode,
} from '@/components/organisations/OrganisationSlideOver';
import {
  type OrganisationRow,
  type CreateOrganisationAdminPayload,
  type UpdateOrganisationAdminPayload,
} from '@/lib/organisationAdapter';

export interface OrganisationsDialogsProps {
  slideOverOpen: boolean;
  onSlideOverOpenChange: (open: boolean) => void;
  selectedOrganisation: OrganisationRow | null;
  slideOverMode: OrganisationSlideOverMode;
  onSaveCreate: (data: CreateOrganisationAdminPayload) => void;
  onSaveUpdate: (data: Omit<UpdateOrganisationAdminPayload, 'organisationId'>) => void;
  isSaving: boolean;

  suspendModalOpen: boolean;
  onSuspendModalOpenChange: (open: boolean) => void;
  organisationToToggle: OrganisationRow | null;
  onConfirmSuspendToggle: () => void;
  isToggling: boolean;
}

export function OrganisationsDialogs({
  slideOverOpen,
  onSlideOverOpenChange,
  selectedOrganisation,
  slideOverMode,
  onSaveCreate,
  onSaveUpdate,
  isSaving,

  suspendModalOpen,
  onSuspendModalOpenChange,
  organisationToToggle,
  onConfirmSuspendToggle,
  isToggling,
}: OrganisationsDialogsProps) {
  const willSuspend = organisationToToggle?.statut === 'ACTIVE';

  return (
    <>
      <OrganisationSlideOver
        open={slideOverOpen}
        onOpenChange={onSlideOverOpenChange}
        organisation={selectedOrganisation}
        mode={slideOverMode}
        onSaveCreate={onSaveCreate}
        onSaveUpdate={onSaveUpdate}
        isSaving={isSaving}
      />

      <Modal open={suspendModalOpen} onOpenChange={onSuspendModalOpenChange}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              {willSuspend ? "Confirmer la suspension" : "Confirmer la réactivation"}
            </ModalTitle>
            <ModalDescription>
              {willSuspend ? (
                <>
                  Êtes-vous sûr de vouloir suspendre{' '}
                  <strong className="text-foreground">{organisationToToggle?.nom}</strong> ?
                  Tous ses utilisateurs ({organisationToToggle?.utilisateursCount ?? 0}) perdront
                  immédiatement l&apos;accès à la plateforme, jusqu&apos;à réactivation.
                </>
              ) : (
                <>
                  Réactiver <strong className="text-foreground">{organisationToToggle?.nom}</strong> ?
                  Ses utilisateurs retrouveront immédiatement l&apos;accès à la plateforme.
                </>
              )}
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline" disabled={isToggling}>
                Annuler
              </Button>
            </ModalClose>
            <Button
              variant={willSuspend ? 'destructive' : 'default'}
              onClick={onConfirmSuspendToggle}
              disabled={isToggling}
            >
              {willSuspend ? (
                <Ban className="h-4 w-4 mr-1.5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              )}
              {isToggling ? 'Traitement...' : willSuspend ? 'Suspendre' : 'Réactiver'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
