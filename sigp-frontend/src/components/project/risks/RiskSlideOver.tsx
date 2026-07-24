import { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Risque, NiveauRisque, RisqueCategorie } from '@/types';
import { RISK_CATEGORIES } from '@/mocks/risksMocks';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalClose,
} from '@/components/ui/overlays/Modal';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Select } from '@/components/ui/forms/Select';
import { Badge } from '@/components/ui/data-display/Badge';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FormState {
  description: string;
  categorie: RisqueCategorie;
  probabilite: '1' | '2' | '3';
  impact: '1' | '2' | '3';
  strategie: string;
}

export interface RiskSlideOverSavePayload {
  description: string;
  categorie: RisqueCategorie;
  probabilite: 1 | 2 | 3;
  impact: 1 | 2 | 3;
  strategie?: string;
}

export interface RiskSlideOverProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: 'new' | 'edit' | 'view';
  risque?: Risque | null;
  /** N° suggéré pour un nouveau risque (RSQ-XXX) — affiché en lecture seule
   * tant qu'aucun `risque` n'existe encore ; ignoré en édition/consultation
   * où `risque.code_risque` fait foi. */
  suggestedCode?: string;
  onSave: (payload: RiskSlideOverSavePayload, id?: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  error?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Matrice 3×3 stricte : score 1-4 FAIBLE, 5-6 MOYEN, 7-9 ÉLEVÉ.
function getNiveauCriticite(criticite: number): NiveauRisque {
  if (criticite <= 4) return 'FAIBLE';
  if (criticite <= 6) return 'MOYEN';
  return 'ELEVE';
}

const NIVEAU_LABEL: Record<NiveauRisque, string> = {
  ELEVE: 'Élevé',
  MOYEN: 'Moyen',
  FAIBLE: 'Faible',
};

type BadgeVariant = 'destructive' | 'warning' | 'outline' | 'success';

function niveauVariant(n: NiveauRisque): BadgeVariant {
  if (n === 'ELEVE') return 'destructive';
  if (n === 'MOYEN') return 'warning';
  return 'success';
}

const P_LABELS: Record<'1' | '2' | '3', string> = {
  '1': '1 — Faible',
  '2': '2 — Moyen',
  '3': '3 — Fort',
};
const I_LABELS: Record<'1' | '2' | '3', string> = {
  '1': '1 — Faible',
  '2': '2 — Moyen',
  '3': '3 — Fort',
};

const INIT: FormState = {
  description: '',
  categorie: 'Technique',
  probabilite: '1',
  impact: '1',
  strategie: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function RiskSlideOver({
  open, onOpenChange, mode, risque, suggestedCode, onSave, onDelete,
  canDelete = true, isSaving = false, isDeleting = false, error = null,
}: RiskSlideOverProps) {
  const [form, setForm] = useState<FormState>(INIT);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if ((mode === 'edit' || mode === 'view') && risque) {
      setForm({
        description: risque.description,
        categorie:   risque.categorie,
        probabilite: String(risque.probabilite) as '1' | '2' | '3',
        impact:      String(risque.impact) as '1' | '2' | '3',
        strategie:   risque.strategie ?? '',
      });
    } else {
      setForm(INIT);
    }
    setErrors({});
    setConfirmDelete(false);
  }, [open, mode, risque]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  // Live preview — criticité calculée
  const criticite = useMemo(
    () => Number(form.probabilite) * Number(form.impact),
    [form.probabilite, form.impact],
  );
  const niveau = useMemo(() => getNiveauCriticite(criticite), [criticite]);

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.description.trim()) e.description = 'La description est requise.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Le SlideOver ne se ferme plus lui-même : le parent possède la mutation
  // et ne ferme qu'après confirmation serveur (cf. audit — fermeture aveugle
  // avant réponse du serveur, qui masquait tout échec 403/réseau).
  function handleSave() {
    if (!validate()) return;
    onSave(
      {
        description: form.description.trim(),
        categorie:   form.categorie,
        probabilite: Number(form.probabilite) as 1 | 2 | 3,
        impact:      Number(form.impact) as 1 | 2 | 3,
        strategie:   form.strategie || undefined,
      },
      risque?.id,
    );
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (risque?.id) onDelete?.(risque.id);
  }

  const title =
    mode === 'new'  ? 'Nouveau risque' :
    mode === 'edit' ? 'Modifier le risque' :
    'Détail du risque';

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* ── Header ── */}
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* N° — généré automatiquement, jamais modifiable (même principe
              que la Référence du marché côté PPM) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="risk-code">
              N°
            </label>
            <Input
              id="risk-code"
              type="text"
              value={risque?.code_risque ?? suggestedCode ?? ''}
              disabled
              readOnly
            />
            <p className="text-[11px] text-muted-foreground mt-1">Généré automatiquement, non modifiable.</p>
          </div>

          {/* Aperçu criticité */}
          {!readOnly && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Criticité calculée</p>
                <p className="text-3xl font-bold font-mono mt-0.5">{criticite}</p>
              </div>
              <div className="text-right">
                <Badge variant={niveauVariant(niveau)} className="text-sm px-3 py-1">
                  {NIVEAU_LABEL[niveau]}
                </Badge>
                <p className="text-[11px] text-muted-foreground mt-1">P={form.probabilite} × I={form.impact}</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="risk-desc">
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="risk-desc"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Décrire le risque identifié…"
              disabled={readOnly}
              error={!!errors.description}
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Catégorie */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="risk-cat">
              Catégorie
            </label>
            <Select
              id="risk-cat"
              value={form.categorie}
              onChange={e => set('categorie', e.target.value as RisqueCategorie)}
              disabled={readOnly}
            >
              {RISK_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          {/* Probabilité + Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="risk-prob">
                Probabilité
              </label>
              <Select
                id="risk-prob"
                value={form.probabilite}
                onChange={e => set('probabilite', e.target.value as '1' | '2' | '3')}
                disabled={readOnly}
              >
                {(['1', '2', '3'] as const).map(v => (
                  <option key={v} value={v}>{P_LABELS[v]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="risk-impact">
                Impact
              </label>
              <Select
                id="risk-impact"
                value={form.impact}
                onChange={e => set('impact', e.target.value as '1' | '2' | '3')}
                disabled={readOnly}
              >
                {(['1', '2', '3'] as const).map(v => (
                  <option key={v} value={v}>{I_LABELS[v]}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Stratégie d'atténuation */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="risk-strategie">
              Stratégie d'atténuation
            </label>
            <Textarea
              id="risk-strategie"
              value={form.strategie}
              onChange={e => set('strategie', e.target.value)}
              placeholder="Décrire la stratégie et les actions d'atténuation prévues ou en cours…"
              rows={4}
              disabled={readOnly}
              className="resize-none"
            />
          </div>

          {/* Historique (mode view/edit) */}
          {risque && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Historique
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">Date de création</span>
                <span className="text-foreground font-medium">
                  {new Date(risque.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <span className="text-muted-foreground">Dernière modification</span>
                <span className="text-foreground font-medium">
                  {new Date(risque.updatedAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          )}

          {/* Bouton Supprimer (mode edit) */}
          {mode === 'edit' && risque && onDelete && canDelete && (
            <div className="pt-2 border-t border-border">
              {confirmDelete ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive font-medium">
                    Confirmer la suppression de {risque.code_risque} ?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                      disabled={isDeleting}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  Supprimer ce risque
                </Button>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <ModalClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </ModalClose>
          {!readOnly && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : mode === 'new' ? 'Créer le risque' : 'Enregistrer'}
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
