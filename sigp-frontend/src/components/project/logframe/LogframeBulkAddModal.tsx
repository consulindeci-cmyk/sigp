import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from '@/components/ui/overlays/Modal';
import { getNiveauPropose, NIVEAUX_LABELS } from './LogframeForm';

export interface LogframeBulkRow { description: string; indicateur?: string }

interface LogframeBulkAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
  parentLevel?: string;
  onSubmit: (rows: LogframeBulkRow[]) => void;
  isSaving?: boolean;
  error?: string | null;
}

function uid(): string {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface Row { tempId: string; description: string; indicateur: string }

function emptyRows(): Row[] {
  return [
    { tempId: uid(), description: '', indicateur: '' },
    { tempId: uid(), description: '', indicateur: '' },
  ];
}

export function LogframeBulkAddModal({
  open,
  onOpenChange,
  parentId,
  parentLevel,
  onSubmit,
  isSaving,
  error,
}: LogframeBulkAddModalProps) {
  const [rows, setRows] = useState<Row[]>(emptyRows());
  const niveau = getNiveauPropose(parentLevel);
  const isActivite = niveau === 'ACTIVITE';

  useEffect(() => {
    if (open) setRows(emptyRows());
  }, [open]);

  function addRow() {
    setRows(prev => [...prev, { tempId: uid(), description: '', indicateur: '' }]);
  }
  function updateRow(tempId: string, patch: Partial<Row>) {
    setRows(prev => prev.map(r => r.tempId === tempId ? { ...r, ...patch } : r));
  }
  function removeRow(tempId: string) {
    setRows(prev => prev.filter(r => r.tempId !== tempId));
  }

  const rowsValides: LogframeBulkRow[] = rows
    .filter(r => r.description.trim())
    .map(r => ({ description: r.description.trim(), indicateur: r.indicateur.trim() || undefined }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rowsValides.length === 0) return;
    onSubmit(rowsValides);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>Ajouter plusieurs éléments</ModalTitle>
          <ModalDescription>
            Niveau {NIVEAUX_LABELS[niveau]} — {parentId ? 'sous l\'élément sélectionné' : 'à la racine'}. Une ligne par élément.
          </ModalDescription>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="logframe-bulk-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
            {!isActivite && (
              <div className="flex items-center gap-2 px-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <span className="w-6 shrink-0" />
                <span className="flex-1">Description</span>
                <span className="flex-1">Indicateur (IOV)</span>
                <span className="w-9 shrink-0" />
              </div>
            )}
            {rows.map((r, i) => (
              <div key={r.tempId} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-xs font-mono text-muted-foreground">{i + 1}.</span>
                <Input
                  autoFocus={i === 0}
                  value={r.description}
                  onChange={e => updateRow(r.tempId, { description: e.target.value })}
                  placeholder="Description..."
                  className="flex-1"
                />
                {!isActivite && (
                  <Input
                    value={r.indicateur}
                    onChange={e => updateRow(r.tempId, { indicateur: e.target.value })}
                    placeholder="Indicateur (IOV)..."
                    className="flex-1"
                  />
                )}
                <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(r.tempId)} aria-label="Retirer cette ligne">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addRow} leftIcon={<Plus className="h-3.5 w-3.5" />} className="self-start">
              Ajouter une ligne
            </Button>
          </form>

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
          <Button variant="default" type="submit" form="logframe-bulk-form" disabled={isSaving || rowsValides.length === 0}>
            {isSaving ? 'Création...' : `Créer ${rowsValides.length || ''} élément${rowsValides.length > 1 ? 's' : ''}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
