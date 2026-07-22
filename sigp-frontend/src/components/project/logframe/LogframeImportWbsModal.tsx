import { useState, useEffect } from 'react';
import { AlertCircle, FolderInput } from 'lucide-react';
import type { WBS } from '@/types';
import { Button } from '@/components/ui/forms/Button';
import { Checkbox } from '@/components/ui/forms/Checkbox';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from '@/components/ui/overlays/Modal';

interface LogframeImportWbsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nœuds racine WBS (composantes) sans logframe_ref_id — cf. LogframePage.tsx */
  candidates: WBS[];
  onSubmit: (nodes: { id: string; libelle: string }[]) => void;
  isSaving?: boolean;
  error?: string | null;
}

export function LogframeImportWbsModal({
  open,
  onOpenChange,
  candidates,
  onSubmit,
  isSaving,
  error,
}: LogframeImportWbsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) setSelected(new Set());
  }, [open]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === candidates.length ? new Set() : new Set(candidates.map(c => c.id)));
  };

  const handleSubmit = () => {
    const nodes = candidates
      .filter(c => selected.has(c.id))
      .map(c => ({ id: c.id, libelle: c.titre }));
    if (nodes.length === 0) return;
    onSubmit(nodes);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>Importer les composantes du projet</ModalTitle>
          <ModalDescription>
            Ces composantes existent déjà dans la structure WBS du projet mais ne sont pas encore
            reliées au Cadre Logique. Les sélectionner crée un Résultat sous l'Impact pour chacune.
          </ModalDescription>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <FolderInput className="h-8 w-8 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">
                Aucune composante WBS en attente d'import.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2.5 px-2 py-2 border-b border-border mb-1">
                <Checkbox
                  checked={selected.size === candidates.length}
                  onCheckedChange={toggleAll}
                />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Tout sélectionner ({candidates.length})
                </span>
              </label>
              {candidates.map(node => (
                <label
                  key={node.id}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <Checkbox checked={selected.has(node.id)} onCheckedChange={() => toggle(node.id)} />
                  <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">{node.code_wbs}</span>
                  <span className="text-sm text-foreground">{node.titre}</span>
                </label>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <ModalFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <ModalClose asChild>
            <Button variant="outline" type="button">Annuler</Button>
          </ModalClose>
          <Button variant="default" type="button" onClick={handleSubmit} disabled={isSaving || selected.size === 0}>
            {isSaving ? 'Import...' : `Importer ${selected.size || ''} composante${selected.size > 1 ? 's' : ''}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
