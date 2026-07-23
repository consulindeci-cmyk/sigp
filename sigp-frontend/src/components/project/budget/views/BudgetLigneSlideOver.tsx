import { useState, useEffect, useMemo } from 'react';
import type { BudgetLigne } from '@/types/budget';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { formatMoney } from '@/utils/format';
import { useWBS } from '@/hooks/useWBS';
import { flattenWBSTree } from '@/utils/tree';

// ─────────────────────────────────────────────────────────────────────────────
// Form types
// ─────────────────────────────────────────────────────────────────────────────

interface LigneFormValues {
  wbs_id:           string;
  code_ligne:       string;
  libelle:          string;
  unite:            string;
  quantite:         string;
  cout_unitaire:    string;
  montant_revise:   string;
  montant_bailleur: string;
}

type LigneFormErrors = Partial<Record<keyof LigneFormValues, string>>;

const EMPTY_FORM: LigneFormValues = {
  wbs_id:           '',
  code_ligne:       '',
  libelle:          '',
  unite:            '',
  quantite:         '',
  cout_unitaire:    '',
  montant_revise:   '',
  montant_bailleur: '',
};

function ligneToForm(l: BudgetLigne): LigneFormValues {
  return {
    wbs_id:           l.wbs_id ?? '',
    code_ligne:       l.code_ligne,
    libelle:          l.libelle ?? '',
    unite:            l.unite ?? '',
    quantite:         l.quantite != null ? String(l.quantite) : '',
    cout_unitaire:    l.cout_unitaire != null ? String(l.cout_unitaire) : '',
    montant_revise:   String(l.montant_revise),
    montant_bailleur: l.montant_bailleur != null ? String(l.montant_bailleur) : '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Field row helper
// ─────────────────────────────────────────────────────────────────────────────

function FRow({
  id, label, error, full = false, children,
}: {
  id?: string; label: string; error?: string; full?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5${full ? ' sm:col-span-2' : ''}`}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>{label}</label>
      {children}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export type LigneSlideOverMode = 'new' | 'edit';

interface BudgetLigneSlideOverProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  ligne:         BudgetLigne | null;
  mode:          LigneSlideOverMode;
  projectId:     string;
  onSave:        (data: Partial<BudgetLigne>) => void;
  isSaving?:     boolean;
  error?:        string | null;
}

export function BudgetLigneSlideOver({
  open, onOpenChange, ligne, mode, projectId, onSave, isSaving, error,
}: BudgetLigneSlideOverProps) {
  const [values, setValues] = useState<LigneFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<LigneFormErrors>({});

  const isEditing = mode === 'edit';

  // wbs_id référence un vrai nœud wbs_nodes du projet — sous-éléments
  // (activités filles) uniquement, même règle que PTBAActiviteForm : une
  // composante racine (parent_id null) ne peut pas être valorisée
  // directement, elle n'existe que comme regroupement dans la Matrice
  // (cf. BudgetComponentSubtotalRow) — l'attacher directement dupliquerait
  // la bande de sous-total et sa seule ligne enfant.
  const { data: wbsData } = useWBS(projectId);
  const wbsNodes = wbsData?.data ?? [];
  const wbsOptions = useMemo(() => {
    const roots = wbsNodes.filter(n => !n.parent_id);
    return flattenWBSTree(roots, wbsNodes).filter(n => !!n.parent_id);
  }, [wbsNodes]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'new') setValues(EMPTY_FORM);
    else if (ligne) setValues(ligneToForm(ligne));
  }, [open, mode, ligne?.id]);

  function set(k: keyof LigneFormValues, v: string) {
    setValues(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  // Auto-remplissage Code/Libellé/Budget depuis le nœud WBS sélectionné —
  // uniquement à la création (cf. même règle que PTBAActiviteForm/
  // WBSNodeForm : en édition, ré-appliquer l'auto-remplissage écraserait
  // silencieusement une valeur déjà personnalisée par l'utilisateur). Le
  // budget est repris depuis budget_alloue (rollup réel des activités PTBA
  // liées à ce nœud) ou, à défaut, enveloppe_cible (plafond bailleur) —
  // uniquement si l'utilisateur n'a pas déjà commencé à saisir un montant.
  function handleWbsChange(newWbsId: string) {
    setValues(prev => {
      const next = { ...prev, wbs_id: newWbsId };
      if (isEditing || !newWbsId) return next;
      const node = wbsOptions.find(n => n.id === newWbsId);
      if (node) {
        next.code_ligne = node.code_wbs;
        next.libelle = node.titre;
        const suggestedBudget = node.budget_alloue || node.enveloppe_cible;
        if (suggestedBudget && !prev.quantite && !prev.cout_unitaire && !prev.montant_revise) {
          next.montant_revise = String(suggestedBudget);
        }
      }
      return next;
    });
  }

  // Coût Total = Quantité × Coût Unitaire quand les deux sont renseignés
  // (modèle de valorisation Excel) — sinon saisie libre du montant total.
  const computedTotal = useMemo(() => {
    const q = Number(values.quantite);
    const c = Number(values.cout_unitaire);
    return q > 0 && c > 0 ? q * c : null;
  }, [values.quantite, values.cout_unitaire]);

  const montantTotal = computedTotal ?? (Number(values.montant_revise) || 0);

  // Montant réellement financé par le bailleur sur cette ligne — déduit
  // automatiquement du Coût Total si l'utilisateur ne le renseigne pas
  // explicitement (hypothèse : financement intégral par défaut), modifiable
  // pour les cas de cofinancement (le bailleur ne couvre qu'une partie).
  const montantBailleur = values.montant_bailleur.trim() === ''
    ? montantTotal
    : Number(values.montant_bailleur);
  const disponibleApercu = montantBailleur - montantTotal;

  function validate(): boolean {
    const errs: LigneFormErrors = {};
    if (!values.libelle.trim()) errs.libelle = 'Requis';
    if (montantTotal <= 0) errs.montant_revise = 'Montant total requis (> 0)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    onSave({
      wbs_id:        values.wbs_id || undefined,
      code_ligne:    values.code_ligne.trim() || `bl-${Date.now()}`,
      libelle:       values.libelle.trim(),
      unite:         values.unite.trim() || undefined,
      quantite:      values.quantite.trim()      === '' ? undefined : Number(values.quantite),
      cout_unitaire: values.cout_unitaire.trim() === '' ? undefined : Number(values.cout_unitaire),
      montant_initial:  montantTotal,
      montant_revise:   montantTotal,
      montant_bailleur: montantBailleur,
    });
  }

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>
            {mode === 'new' ? 'Nouvelle ligne budgétaire' : 'Modifier la ligne budgétaire'}
          </SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          <div className="flex flex-col gap-6">

            {/* ── Rattachement WBS ──────────────────────────────────────────── */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                Rattachement WBS
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <FRow id="wbs-node" label="Activité WBS">
                  <Select
                    id="wbs-node"
                    value={values.wbs_id}
                    onChange={e => handleWbsChange(e.target.value)}
                  >
                    <option value="">— Aucune liaison —</option>
                    {wbsOptions.map(n => (
                      <option key={n.id} value={n.id}>
                        {'  '.repeat(Math.max(0, n.niveau - 2))}{n.code_wbs} — {n.titre}
                      </option>
                    ))}
                  </Select>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {isEditing
                      ? 'Modifier le rattachement ne met pas à jour automatiquement Code/Libellé/Budget ci-dessous.'
                      : "Sélectionner une activité pré-remplit Code WBS, Libellé et le Coût Total (depuis le budget WBS/PTBA déjà planifié) — tout reste modifiable ensuite."}
                    {' '}Les composantes racine (1.0, 2.0…) ne sont pas proposées ici — seules les activités filles (1.1, 1.2…) sont valorisables.
                  </span>
                </FRow>
              </div>
            </div>

            {/* ── Identification ────────────────────────────────────────────── */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                Identification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FRow id="wbs-nom" label="Libellé *" error={errors.libelle} full>
                  <Input
                    id="wbs-nom"
                    value={values.libelle}
                    onChange={e => set('libelle', e.target.value)}
                    placeholder="Ex : Construction Ligne HT"
                  />
                </FRow>
                <FRow id="wbs-id" label="Code WBS">
                  <Input
                    id="wbs-id"
                    value={values.code_ligne}
                    onChange={e => set('code_ligne', e.target.value)}
                    placeholder="Ex : 1.1"
                    className="font-mono"
                  />
                </FRow>
              </div>
            </div>

            {/* ── Valorisation ──────────────────────────────────────────────── */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                Valorisation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FRow id="unite" label="Unité">
                  <Input
                    id="unite"
                    value={values.unite}
                    onChange={e => set('unite', e.target.value)}
                    placeholder="Ex : ml, unité, forfait…"
                  />
                </FRow>
                <FRow id="quantite" label="Quantité">
                  <Input
                    id="quantite"
                    type="number"
                    min={0}
                    step="any"
                    value={values.quantite}
                    onChange={e => set('quantite', e.target.value)}
                    placeholder="0"
                    className="font-mono"
                  />
                </FRow>
                <FRow id="cout-unitaire" label="Coût Unitaire">
                  <Input
                    id="cout-unitaire"
                    type="number"
                    min={0}
                    step="any"
                    value={values.cout_unitaire}
                    onChange={e => set('cout_unitaire', e.target.value)}
                    placeholder="0"
                    className="font-mono"
                  />
                </FRow>
                <FRow id="cout-total" label="Coût Total *" error={errors.montant_revise}>
                  {computedTotal != null ? (
                    <div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/30 font-mono text-sm font-semibold text-foreground">
                      {formatMoney(computedTotal)}
                    </div>
                  ) : (
                    <Input
                      id="cout-total"
                      type="number"
                      min={0}
                      value={values.montant_revise}
                      onChange={e => set('montant_revise', e.target.value)}
                      placeholder="0"
                      className="font-mono"
                    />
                  )}
                </FRow>
                {computedTotal != null && (
                  <p className="text-[11px] text-muted-foreground sm:col-span-2 -mt-2">
                    Calculé automatiquement : Quantité × Coût Unitaire.
                  </p>
                )}
              </div>
            </div>

            {/* ── Financement Bailleur ──────────────────────────────────────── */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                Financement Bailleur
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FRow id="montant-bailleur" label="Montant financé par le bailleur">
                  <Input
                    id="montant-bailleur"
                    type="number"
                    min={0}
                    value={values.montant_bailleur}
                    onChange={e => set('montant_bailleur', e.target.value)}
                    placeholder={`Par défaut : Coût Total (${formatMoney(montantTotal)})`}
                    className="font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Laissez vide si le bailleur finance intégralement le Coût Total — ne renseigner que
                    pour un cofinancement (le bailleur ne couvre qu'une partie de la ligne).
                  </span>
                </FRow>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/20 px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Disponible (aperçu)
                </span>
                <span className={`font-mono text-sm font-bold ${disponibleApercu < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {disponibleApercu < 0 ? `-${formatMoney(Math.abs(disponibleApercu))}` : formatMoney(disponibleApercu)}
                </span>
              </div>
            </div>

          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline" type="button">Annuler</Button>
          </SlideOverClose>
          <Button variant="default" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : mode === 'edit' ? 'Enregistrer les modifications' : 'Ajouter la ligne'}
          </Button>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
