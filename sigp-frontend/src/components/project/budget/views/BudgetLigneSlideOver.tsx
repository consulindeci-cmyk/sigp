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
import { useFundingSources } from '@/hooks/useFundingSources';

// ─────────────────────────────────────────────────────────────────────────────
// Référentiels
// ─────────────────────────────────────────────────────────────────────────────

export const SOURCES_REF = [
  { id: 'PRET',         nom: 'Prêt'                   },
  { id: 'DON',          nom: 'Don'                     },
  { id: 'CONTREPARTIE', nom: 'Contrepartie nationale'  },
  { id: 'SUBVENTION',   nom: 'Subvention'              },
];

export const CATEGORIES_REF = [
  { id: 'TRAVAUX',        nom: 'Travaux'                       },
  { id: 'BIENS',          nom: 'Biens'                         },
  { id: 'SERVICES',       nom: 'Services de Consultants'       },
  { id: 'FONCTIONNEMENT', nom: 'Fonctionnement / UGP'          },
  { id: 'FORMATION',      nom: 'Formation & Renforcement'      },
];

// ─────────────────────────────────────────────────────────────────────────────
// Form types
// ─────────────────────────────────────────────────────────────────────────────

interface LigneFormValues {
  libelle:               string;
  code_ligne:                string;
  bailleur_id:           string;
  source_financement_id: string;
  categorie_id:          string;
  compte_comptable_id:   string;
  montant_initial:       string;
  montant_revise:        string;
  montant_pre_engage:    string;
  montant_engage:        string;
  montant_liquide:       string;
  montant_decaisse:      string;
}

type LigneFormErrors = Partial<Record<keyof LigneFormValues, string>>;

const EMPTY_FORM: LigneFormValues = {
  libelle:               '',
  code_ligne:                '',
  bailleur_id:           '',
  source_financement_id: 'PRET',
  categorie_id:          '',
  compte_comptable_id:   '',
  montant_initial:       '',
  montant_revise:        '',
  montant_pre_engage:    '0',
  montant_engage:        '0',
  montant_liquide:       '0',
  montant_decaisse:      '0',
};

function ligneToForm(l: BudgetLigne): LigneFormValues {
  return {
    libelle:               l.libelle               ?? '',
    code_ligne:                l.code_ligne,
    bailleur_id:           l.bailleur_id,
    source_financement_id: l.source_financement_id,
    categorie_id:          l.categorie_id,
    compte_comptable_id:   l.compte_comptable_id   ?? '',
    montant_initial:       String(l.montant_initial),
    montant_revise:        String(l.montant_revise),
    montant_pre_engage:    String(l.montant_pre_engage),
    montant_engage:        String(l.montant_engage),
    montant_liquide:       String(l.montant_liquide),
    montant_decaisse:      String(l.montant_decaisse),
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

  // bailleur_id référence désormais une vraie funding_sources.id du projet —
  // plus de catalogue statique (cf. audit Budget/Sources de Financement).
  const { data: fundingSources = [], isLoading: isLoadingFunding } = useFundingSources(projectId);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'new') setValues(EMPTY_FORM);
    else if (ligne) setValues(ligneToForm(ligne));
  }, [open, mode, ligne?.id]);

  function set(k: keyof LigneFormValues, v: string) {
    setValues(prev => {
      const next = { ...prev, [k]: v };
      // Auto-sync montant_revise = montant_initial when adding
      if (k === 'montant_initial' && mode === 'new') next.montant_revise = v;
      return next;
    });
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  // Computed derived fields (preview, read-only)
  const solde = useMemo(() => {
    const r  = Number(values.montant_revise)     || 0;
    const pe = Number(values.montant_pre_engage) || 0;
    const e  = Number(values.montant_engage)     || 0;
    return Math.max(0, r - pe - e);
  }, [values.montant_revise, values.montant_pre_engage, values.montant_engage]);

  const rap = useMemo(() => {
    const e = Number(values.montant_engage)   || 0;
    const d = Number(values.montant_decaisse) || 0;
    return Math.max(0, e - d);
  }, [values.montant_engage, values.montant_decaisse]);

  function validate(): boolean {
    const errs: LigneFormErrors = {};
    if (!values.libelle.trim()) errs.libelle     = 'Requis';
    if (!values.bailleur_id)    errs.bailleur_id  = 'Requis';
    if (!values.categorie_id)   errs.categorie_id = 'Requis';

    const init   = Number(values.montant_initial)    || 0;
    const rev    = Number(values.montant_revise)     || 0;
    const preEng = Number(values.montant_pre_engage) || 0;
    const eng    = Number(values.montant_engage)     || 0;
    const liq    = Number(values.montant_liquide)    || 0;
    const dec    = Number(values.montant_decaisse)   || 0;

    if (init <= 0) errs.montant_initial = 'Montant requis (> 0)';
    if (rev  <= 0) errs.montant_revise  = 'Montant révisé requis (> 0)';

    // ── Règles métier ───────────────────────────────────────────────────────
    if (rev > 0 && preEng > rev) {
      errs.montant_pre_engage = `Pré-engagement (${formatMoney(preEng)}) > Budget révisé (${formatMoney(rev)})`;
    }
    if (rev > 0 && eng > rev) {
      errs.montant_engage = `Engagement (${formatMoney(eng)}) > Budget révisé (${formatMoney(rev)})`;
    }
    if (eng > 0 && dec > eng) {
      errs.montant_decaisse = `Décaissement (${formatMoney(dec)}) > Engagement (${formatMoney(eng)})`;
    }
    if (eng > 0 && liq > eng) {
      errs.montant_liquide = `Liquidation (${formatMoney(liq)}) > Engagement (${formatMoney(eng)})`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const montant_initial    = Number(values.montant_initial)    || 0;
    const montant_revise     = Number(values.montant_revise)     || 0;
    const montant_pre_engage = Number(values.montant_pre_engage) || 0;
    const montant_engage     = Number(values.montant_engage)     || 0;
    const montant_liquide    = Number(values.montant_liquide)    || 0;
    const montant_decaisse   = Number(values.montant_decaisse)   || 0;
    const bailleur = fundingSources.find(b => b.id === values.bailleur_id);

    onSave({
      libelle:               values.libelle.trim(),
      code_ligne:                values.code_ligne.trim() || `wbs-${Date.now()}`,
      bailleur_id:           values.bailleur_id,
      bailleur_nom:          bailleur?.nom ?? values.bailleur_id,
      source_financement_id: values.source_financement_id,
      categorie_id:          values.categorie_id,
      compte_comptable_id:   values.compte_comptable_id.trim() || undefined,
      montant_initial,
      montant_revise,
      montant_pre_engage,
      montant_engage,
      montant_liquide,
      montant_decaisse,
      solde_disponible:      solde,
      reste_a_payer:         rap,
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

            {/* ── Identification ────────────────────────────────────────────── */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                Identification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FRow id="wbs-nom" label="Composante / WBS *" error={errors.libelle} full>
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
                    placeholder="Ex : wbs-1-1"
                    className="font-mono"
                  />
                </FRow>

                <FRow id="bailleur" label="Bailleur *" error={errors.bailleur_id}>
                  <Select
                    id="bailleur"
                    value={values.bailleur_id}
                    onChange={e => set('bailleur_id', e.target.value)}
                    disabled={isLoadingFunding}
                  >
                    <option value="">{isLoadingFunding ? 'Chargement…' : 'Sélectionner…'}</option>
                    {fundingSources.map(b => (
                      <option key={b.id} value={b.id}>{b.nom}</option>
                    ))}
                  </Select>
                  {!isLoadingFunding && fundingSources.length === 0 && (
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      Aucune source de financement pour ce projet — ajoutez-en une depuis l'onglet Sources de Financement.
                    </span>
                  )}
                </FRow>

                <FRow id="source" label="Source de financement">
                  <Select
                    id="source"
                    value={values.source_financement_id}
                    onChange={e => set('source_financement_id', e.target.value)}
                  >
                    {SOURCES_REF.map(s => (
                      <option key={s.id} value={s.id}>{s.nom}</option>
                    ))}
                  </Select>
                </FRow>

                <FRow id="categorie" label="Catégorie *" error={errors.categorie_id}>
                  <Select
                    id="categorie"
                    value={values.categorie_id}
                    onChange={e => set('categorie_id', e.target.value)}
                  >
                    <option value="">Sélectionner…</option>
                    {CATEGORIES_REF.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </Select>
                </FRow>

                <FRow id="compte" label="Compte PCG">
                  <Input
                    id="compte"
                    value={values.compte_comptable_id}
                    onChange={e => set('compte_comptable_id', e.target.value)}
                    placeholder="Ex : 611000"
                    className="font-mono"
                  />
                </FRow>
              </div>
            </div>

            {/* ── Montants budgétaires ──────────────────────────────────────── */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                Montants budgétaires
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FRow id="m-initial" label="Montant initial *" error={errors.montant_initial}>
                  <Input
                    id="m-initial"
                    type="number"
                    min={0}
                    value={values.montant_initial}
                    onChange={e => set('montant_initial', e.target.value)}
                    placeholder="0"
                    className="font-mono"
                  />
                </FRow>
                <FRow id="m-revise" label="Montant révisé *" error={errors.montant_revise}>
                  <Input
                    id="m-revise"
                    type="number"
                    min={0}
                    value={values.montant_revise}
                    onChange={e => set('montant_revise', e.target.value)}
                    placeholder="0"
                    className="font-mono"
                  />
                </FRow>
              </div>
            </div>

            {/* ── Exécution financière ─────────────────────────────────────── */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                Exécution financière
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FRow id="m-preeng" label="Pré-engagé">
                  <Input
                    id="m-preeng"
                    type="number"
                    min={0}
                    value={values.montant_pre_engage}
                    onChange={e => set('montant_pre_engage', e.target.value)}
                    placeholder="0"
                    className="font-mono"
                  />
                </FRow>
                <FRow id="m-eng" label="Engagé">
                  <Input
                    id="m-eng"
                    type="number"
                    min={0}
                    value={values.montant_engage}
                    onChange={e => set('montant_engage', e.target.value)}
                    placeholder="0"
                    className="font-mono"
                  />
                </FRow>
                <FRow id="m-liq" label="Liquidé">
                  <Input
                    id="m-liq"
                    type="number"
                    min={0}
                    value={values.montant_liquide}
                    onChange={e => set('montant_liquide', e.target.value)}
                    placeholder="0"
                    className="font-mono"
                  />
                </FRow>
                <FRow id="m-dec" label="Décaissé">
                  <Input
                    id="m-dec"
                    type="number"
                    min={0}
                    value={values.montant_decaisse}
                    onChange={e => set('montant_decaisse', e.target.value)}
                    placeholder="0"
                    className="font-mono"
                  />
                </FRow>
              </div>
            </div>

            {/* ── Totaux calculés (readonly) ────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 bg-muted/20 rounded-lg p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Solde disponible</p>
                <p className={`font-mono text-base font-bold ${solde > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {formatMoney(solde)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Révisé − Pré-eng. − Engagé</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Reste à payer</p>
                <p className={`font-mono text-base font-bold ${rap > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {formatMoney(rap)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Engagé − Décaissé</p>
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
