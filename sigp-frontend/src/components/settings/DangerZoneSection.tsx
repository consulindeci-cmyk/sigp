import { useState } from 'react';
import { RotateCcw, UserX, LogOut, CheckCircle2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/Card';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';

interface DangerZoneSectionProps {
  onResetPreferences: () => void;
  onTerminateAllSessions: () => void;
}

export function DangerZoneSection({ onResetPreferences, onTerminateAllSessions }: DangerZoneSectionProps) {
  const [resetOpen, setResetOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const [resetDone, setResetDone] = useState(false);
  const [sessionsDone, setSessionsDone] = useState(false);

  function handleResetConfirm() {
    onResetPreferences();
    setResetOpen(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 4000);
  }

  function handleTerminateAllConfirm() {
    onTerminateAllSessions();
    setSessionsOpen(false);
    setSessionsDone(true);
    setTimeout(() => setSessionsDone(false), 4000);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
        <TriangleAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-destructive">
          Les actions ci-dessous sont potentiellement irréversibles. Procédez avec prudence.
        </p>
      </div>

      {/* Reset preferences */}
      <Card className="border-warning/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-warning/10 text-warning flex items-center justify-center shrink-0" aria-hidden="true">
              <RotateCcw className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Réinitialiser les préférences</CardTitle>
              <CardDescription className="text-[11px]">
                Remet toutes les préférences (langue, apparence, notifications, etc.) à leurs valeurs par défaut.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {resetDone && (
              <span className="flex items-center gap-1.5 text-sm text-success" aria-live="polite">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Préférences réinitialisées
              </span>
            )}
            <Button
              variant="outline"
              className="border-warning/40 text-warning hover:bg-warning/10"
              onClick={() => setResetOpen(true)}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Terminate all sessions */}
      <Card className="border-orange-300/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-warning/10 text-warning flex items-center justify-center shrink-0" aria-hidden="true">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Déconnecter toutes les sessions</CardTitle>
              <CardDescription className="text-[11px]">
                Termine toutes les sessions actives sauf la session courante.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {sessionsDone && (
              <span className="flex items-center gap-1.5 text-sm text-success" aria-live="polite">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Sessions terminées
              </span>
            )}
            <Button
              variant="outline"
              className="border-warning/40 text-warning hover:bg-warning/10"
              onClick={() => setSessionsOpen(true)}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Tout déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate account */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0" aria-hidden="true">
              <UserX className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base text-destructive">Désactiver le compte</CardTitle>
              <CardDescription className="text-[11px]">
                Désactive temporairement votre compte. Vos données sont conservées. Contactez un administrateur pour la réactivation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setDeactivateOpen(true)}
            leftIcon={<UserX className="h-4 w-4" />}
          >
            Désactiver le compte
          </Button>
        </CardContent>
      </Card>

      {/* ── Modal: Reset preferences ─────────────────────────────── */}
      <Modal open={resetOpen} onOpenChange={setResetOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Réinitialiser les préférences ?</ModalTitle>
            <ModalDescription>
              Toutes vos préférences d'affichage, de langue, de fuseau horaire et de notifications seront
              remises aux valeurs par défaut. Cette action ne peut pas être annulée.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button
              variant="outline"
              className="border-warning/40 text-warning hover:bg-warning/10"
              onClick={handleResetConfirm}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Réinitialiser
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Modal: Terminate all sessions ────────────────────────── */}
      <Modal open={sessionsOpen} onOpenChange={setSessionsOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Déconnecter toutes les sessions ?</ModalTitle>
            <ModalDescription>
              Tous les appareils connectés (sauf la session courante) seront déconnectés immédiatement.
              Vous devrez vous reconnecter sur ces appareils.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button
              variant="outline"
              className="border-warning/40 text-warning hover:bg-warning/10"
              onClick={handleTerminateAllConfirm}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Tout déconnecter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Modal: Deactivate account ─────────────────────────────── */}
      <Modal open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Désactiver le compte ?</ModalTitle>
            <ModalDescription>
              Votre compte sera suspendu. Vous ne pourrez plus vous connecter à SIGP.
              Vos données sont conservées. Un administrateur peut réactiver le compte à tout moment.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <ModalClose asChild>
              <Button variant="destructive" leftIcon={<UserX className="h-4 w-4" />}>
                Désactiver le compte
              </Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
