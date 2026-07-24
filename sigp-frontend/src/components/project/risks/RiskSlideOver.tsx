import { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Risque, NiveauRisque, RisqueCategorie, StatutRisque } from '@/types';
import { RISK_CATEGORIES, STATUT_RISQUE_OPTIONS } from '@/mocks/risksMocks';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalClose,
} from '@/components/ui/overlays/Modal';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Select } from '@/components/ui/forms/Select';
import { Badge } from '@/components/ui/data-display/Badge';
import { useOrganisationMembersForPicker } from '@/hooks/useGovernance';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FormState {
  description: string;
  categorie: RisqueCategorie;
  probabilite: '1' | '2' | '3';
  impact: '1' | '2' | '3';
  responsableId: string;
  strategie: string;
  statut: StatutRisque;
  date_identification: string;
  date_revision_prevue: string;
}

export interface RiskSlideOverSavePayload {
  description: string;
  categorie: RisqueCategorie;
  probabilite: 1 | 2 | 3;
  impact: 1 | 2 | 3;
  responsable: string;
  responsableId: string;
  strategie?: string;
  statut: StatutRisque;
  date_identification: string;
  date_revision_prevue?: string;
}

export interface RiskSlideOverProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: 'new' | 'edit' | 'view';
  projectId: string;
  risque?: Risque | null;
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
  responsableId: '',
  strategie: '',
  statut: 'OUVERT',
  date_identification: new Date().toISOString().slice(0, 10),
  date_revision_prevue: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function RiskSlideOver({
  open, onOpenChange, mode, projectId, risque, onSave, onDelete,
  canDelete = true, isSaving = false, isDeleting = false, error = null,
}: RiskSlideOverProps) {
  const [form, setForm] = useState<FormState>(INIT);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const readOnly = mode === 'view';

  // Vivier de l'organisation pour le sélecteur Responsable —
  // risques.responsable_id est une vraie FK vers users(id), plus de saisie libre.
  const { data: orgMembers = [], isLoading: isLoadingMembers } = useOrganisationMembersForPicker(projectId);

  // Si le responsable actuellement assigné n'est plus actif (ou n'est plus
  // dans la liste pour une autre raison), on l'injecte quand même comme
  // option pour ne pas silencieusement vider/réinitialiser le champ à l'édition.
  const responsableOptions = useMemo(() => {
    if (risque?.responsableId && !orgMembers.some(m => m.id === risque.responsableId)) {
      return [...orgMembers, { id: risque.responsableId, displayName: risque.responsable || 'Utilisateur inconnu' }];
    }
    return orgMembers;
  }, [orgMembers, risque]);

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if ((mode === 'edit' || mode === 'view') && risque) {
      setForm({
        description:         risque.description,
        categorie:           risque.categorie,
        probabilite:         String(risque.probabilite) as '1' | '2' | '3',
        impact:              String(risque.impact) as '1' | '2' | '3',
        responsableId:       risque.responsableId ?? '',
        strategie:           risque.strategie ?? '',
        statut:              risque.statut,
        date_identification: risque.date_identification,
        date_revision_prevue: risque.date_revision_prevue ?? '',
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
    if (!form.responsableId) e.responsableId = 'Le responsable est requis.';
    if (!form.date_identification) e.date_identification = 'La date est requise.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Le SlideOver ne se ferme plus lui-même : le parent possède la mutation
  // et ne ferme qu'après confirmation serveur (cf. audit — fermeture aveugle
  // avant réponse du serveur, qui masquait tout échec 403/réseau).
  function handleSave() {
    if (!validate()) return;
    const selectedMember = responsableOptions.find(m => m.id === form.responsableId);
    onSave(
      {
        description:         form.description.trim(),
        categorie:           form.categorie,
        probabilite:         Number(form.probabilite) as 1 | 2 | 3,
        impact:              Number(form.impact) as 1 | 2 | 3,
        responsableId:       form.responsableId,
        responsable:         selectedMember?.displayName ?? '',
        strategie:           form.strategie || undefined,
        statut:              form.statut,
        date_identification: form.date_identification,
        date_revision_prevue: form.date_revision_prevue || undefined,
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
          {risque && (
            <p className="text-xs text-muted-foreground">{risque.code_risque}</p>
          )}
        </ModalHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
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
            <Input
              id="risk-desc"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Décrire le risque identifié…"
              disabled={readOnly}
              error={!!errors.description}
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

          {/* Responsable */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="risk-resp">
              Responsable <span className="text-destructive">*</span>
            </label>
            <Select
              id="risk-resp"
              value={form.responsableId}
              onChange={e => set('responsableId', e.target.value)}
              disabled={readOnly || isLoadingMembers}
              error={!!errors.responsableId}
            >
              <option value="">{isLoadingMembers ? 'Chargement…' : 'Sélectionner une personne'}</option>
              {responsableOptions.map(m => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </Select>
            {errors.responsableId && (
              <p className="text-xs text-destructive">{errors.responsableId}</p>
            )}
          </div>

          {/* Statut */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="risk-statut">
              Statut
            </label>
            <Select
              id="risk-statut"
              value={form.statut}
              onChange={e => set('statut', e.target.value as StatutRisque)}
              disabled={readOnly}
            >
              {STATUT_RISQUE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="risk-date-id">
                Date d'identification <span className="text-destructive">*</span>
              </label>
              <Input
                id="risk-date-id"
                type="date"
                value={form.date_identification}
                onChange={e => set('date_identification', e.target.value)}
                disabled={readOnly}
                error={!!errors.date_identification}
              />
              {errors.date_identification && (
                <p className="text-xs text-destructive">{errors.date_identification}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="risk-date-rev">
                Date de révision prévue
              </label>
              <Input
                id="risk-date-rev"
                type="date"
                value={form.date_revision_prevue}
                onChange={e => set('date_revision_prevue', e.target.value)}
                disabled={readOnly}
              />
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
                <span className="text-muted-foreground">Responsable</span>
                <span className="text-foreground font-medium">{risque.responsable || '—'}</span>
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
