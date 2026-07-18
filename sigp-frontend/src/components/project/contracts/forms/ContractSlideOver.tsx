import { useState, useEffect, useMemo } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import type { Contract, ContractStatus } from '@/types/contract';
import { usePPM } from '@/hooks/usePPM';
import { useBudget, useBudgetVersion } from '@/hooks/useBudget';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ContractFormState = {
  reference: string;
  intitule: string;
  statut: string;
  bailleur_id: string;
  fournisseur_id: string;
  wbs_id: string;
  budget_ligne_id: string;
  ppm_ligne_id: string;
  marche_id: string;
  devise_code: string;
  taux_change_contractuel: string;
  montant_initial_devise: string;
  date_signature: string;
  date_ordre_service: string;
  debut_prevu: string;
  fin_prevue: string;
  fin_reelle: string;
  reception_provisoire: string;
  reception_definitive: string;
  garantie_bonne_execution_taux: string;
  garantie_avance_taux: string;
  retenue_garantie_taux: string;
  date_expiration_garantie: string;
};

const EMPTY_FORM: ContractFormState = {
  reference: '', intitule: '', statut: 'BROUILLON',
  bailleur_id: '', fournisseur_id: '',
  wbs_id: '', budget_ligne_id: '', ppm_ligne_id: '', marche_id: '',
  devise_code: 'XOF', taux_change_contractuel: '1', montant_initial_devise: '',
  date_signature: '', date_ordre_service: '', debut_prevu: '',
  fin_prevue: '', fin_reelle: '',
  reception_provisoire: '', reception_definitive: '',
  garantie_bonne_execution_taux: '', garantie_avance_taux: '',
  retenue_garantie_taux: '', date_expiration_garantie: '',
};

function formFromContract(c: Contract): ContractFormState {
  return {
    reference: c.reference,
    intitule: c.intitule,
    statut: c.statut,
    bailleur_id: c.bailleur_id,
    fournisseur_id: c.fournisseur_id,
    wbs_id: c.wbs_id,
    budget_ligne_id: c.budget_ligne_id,
    ppm_ligne_id: c.ppm_ligne_id,
    marche_id: c.marche_id,
    devise_code: c.devise_code,
    taux_change_contractuel: String(c.taux_change_contractuel),
    montant_initial_devise: String(c.montant_initial_devise),
    date_signature: c.date_signature ?? '',
    date_ordre_service: c.date_ordre_service ?? '',
    debut_prevu: c.debut_prevu ?? '',
    fin_prevue: c.fin_prevue ?? '',
    fin_reelle: c.fin_reelle ?? '',
    reception_provisoire: c.reception_provisoire ?? '',
    reception_definitive: c.reception_definitive ?? '',
    garantie_bonne_execution_taux: c.garantie_bonne_execution_taux != null ? String(c.garantie_bonne_execution_taux) : '',
    garantie_avance_taux: c.garantie_avance_taux != null ? String(c.garantie_avance_taux) : '',
    retenue_garantie_taux: c.retenue_garantie_taux != null ? String(c.retenue_garantie_taux) : '',
    date_expiration_garantie: c.date_expiration_garantie ?? '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Styling constants
// ─────────────────────────────────────────────────────────────────────────────

const LABEL = 'block text-xs font-semibold text-muted-foreground mb-1';
const SECTION = 'border-t border-border pt-4 mt-4';
const SECTION_TITLE = 'text-xs font-bold text-foreground uppercase tracking-wide mb-3';
const GRID2 = 'grid grid-cols-2 gap-3';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ContractSlideOverProps {
  open: boolean;
  onClose: () => void;
  mode: 'view' | 'edit' | 'new';
  contract?: Contract | null;
  onSave: (data: Omit<Contract, 'id' | 'version_hash' | 'projet_id'>) => void;
  onDelete?: (id: string) => void;
  onSwitchToEdit?: () => void;
  projectId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ContractSlideOver({ open, onClose, mode, contract, onSave, onDelete, onSwitchToEdit, projectId }: ContractSlideOverProps) {
  const [form, setForm] = useState<ContractFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ContractFormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Marchés du plan de passation (PPM) du projet — pour rattacher ce contrat
  // à un ou plusieurs lots (ppm_marches.id → contracts.marche_id).
  const { lignes: ppmMarches } = usePPM(projectId);

  // Lignes budgétaires de la version active du projet — pour l'imputation
  // réelle du contrat (contracts.budget_ligne_id).
  const { data: budget } = useBudget(projectId);
  const { data: budgetVersion } = useBudgetVersion(projectId, budget?.version_active_id);
  const budgetLignes = budgetVersion?.lignes ?? [];

  const isReadOnly = mode === 'view';

  useEffect(() => {
    if (open) {
      setForm(contract ? formFromContract(contract) : EMPTY_FORM);
      setErrors({});
      setConfirmDelete(false);
    }
  }, [open, contract, mode]);

  const set = (k: keyof ContractFormState, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const autoMontantBase = useMemo(() => {
    const montant = parseFloat(form.montant_initial_devise) || 0;
    const taux = parseFloat(form.taux_change_contractuel) || 1;
    return Math.round(montant * taux);
  }, [form.montant_initial_devise, form.taux_change_contractuel]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof ContractFormState, string>> = {};
    if (!form.reference.trim()) e.reference = 'Référence requise';
    if (!form.intitule.trim()) e.intitule = 'Intitulé requis';
    if (!form.montant_initial_devise || parseFloat(form.montant_initial_devise) <= 0)
      e.montant_initial_devise = 'Montant requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      wbs_id: form.wbs_id,
      budget_ligne_id: form.budget_ligne_id,
      ppm_ligne_id: form.ppm_ligne_id,
      marche_id: form.marche_id,
      bailleur_id: form.bailleur_id,
      fournisseur_id: form.fournisseur_id,
      reference: form.reference.trim(),
      intitule: form.intitule.trim(),
      statut: form.statut as ContractStatus,
      devise_code: form.devise_code,
      taux_change_contractuel: parseFloat(form.taux_change_contractuel) || 1,
      montant_initial_devise: parseFloat(form.montant_initial_devise) || 0,
      montant_initial_base: autoMontantBase,
      date_signature: form.date_signature || undefined,
      date_ordre_service: form.date_ordre_service || undefined,
      debut_prevu: form.debut_prevu || undefined,
      fin_prevue: form.fin_prevue || undefined,
      fin_reelle: form.fin_reelle || undefined,
      reception_provisoire: form.reception_provisoire || undefined,
      reception_definitive: form.reception_definitive || undefined,
      garantie_bonne_execution_taux: form.garantie_bonne_execution_taux ? parseFloat(form.garantie_bonne_execution_taux) : undefined,
      garantie_avance_taux: form.garantie_avance_taux ? parseFloat(form.garantie_avance_taux) : undefined,
      retenue_garantie_taux: form.retenue_garantie_taux ? parseFloat(form.retenue_garantie_taux) : undefined,
      date_expiration_garantie: form.date_expiration_garantie || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (contract && onDelete) {
      onDelete(contract.id);
      onClose();
    }
  };

  const title =
    mode === 'new' ? 'Nouveau Contrat' :
    mode === 'edit' ? 'Modifier le Contrat' :
    'Détails du Contrat';

  return (
    <SlideOver open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SlideOverContent className="w-full max-w-2xl">
        <SlideOverHeader className="flex items-center justify-between gap-2 px-6 py-4 border-b border-border bg-card">
          <SlideOverTitle className="text-base font-bold text-foreground">{title}</SlideOverTitle>
          <SlideOverClose asChild>
            <button className="rounded-md p-1 hover:bg-muted text-muted-foreground" aria-label="Fermer">
              <X size={16} />
            </button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody className="flex-1 overflow-y-auto px-6 py-5 space-y-1">

          {/* ── Identification ─────────────────────────────────────── */}
          <p className={SECTION_TITLE}>Identification</p>
          <div className={GRID2}>
            <div>
              <label className={LABEL}>Référence *</label>
              <Input
                value={form.reference}
                onChange={e => set('reference', e.target.value)}
                placeholder="CTR-2026-001"
                disabled={isReadOnly}
              />
              {errors.reference && <p className="text-xs text-destructive mt-1">{errors.reference}</p>}
            </div>
            <div>
              <label className={LABEL}>Statut</label>
              <Select value={form.statut} onChange={e => set('statut', e.target.value)} disabled={isReadOnly}>
                <option value="BROUILLON">Brouillon</option>
                <option value="SIGNE">Signé</option>
                <option value="EN_EXECUTION">En Exécution</option>
                <option value="SUSPENDU">Suspendu</option>
                <option value="RESILIE">Résilié</option>
                <option value="TERMINE">Terminé</option>
                <option value="CLOTURE">Clôturé</option>
              </Select>
            </div>
          </div>
          <div className="mt-3">
            <label className={LABEL}>Intitulé / Objet du marché *</label>
            <Input
              value={form.intitule}
              onChange={e => set('intitule', e.target.value)}
              placeholder="Description de l'objet du contrat"
              disabled={isReadOnly}
            />
            {errors.intitule && <p className="text-xs text-destructive mt-1">{errors.intitule}</p>}
          </div>

          {/* ── Parties ───────────────────────────────────────────── */}
          <div className={SECTION}>
            <p className={SECTION_TITLE}>Parties</p>
            <div className={GRID2}>
              <div>
                <label className={LABEL}>Bailleur</label>
                <Input
                  value={form.bailleur_id}
                  onChange={e => set('bailleur_id', e.target.value)}
                  placeholder="ex. b-ida"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className={LABEL}>Titulaire / Fournisseur</label>
                <Input
                  value={form.fournisseur_id}
                  onChange={e => set('fournisseur_id', e.target.value)}
                  placeholder="ex. SOGEA SATOM"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* ── Imputation ────────────────────────────────────────── */}
          <div className={SECTION}>
            <p className={SECTION_TITLE}>Imputation budgétaire</p>
            <div className="mb-3">
              <label className={LABEL}>Marché PPM (plan de passation)</label>
              <Select value={form.marche_id} onChange={e => set('marche_id', e.target.value)} disabled={isReadOnly}>
                <option value="">Aucun</option>
                {ppmMarches.map(m => (
                  <option key={m.id} value={m.id}>{m.reference_marche} — {m.description}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>WBS</label>
                <Input value={form.wbs_id} onChange={e => set('wbs_id', e.target.value)} placeholder="wbs-1" disabled={isReadOnly} />
              </div>
              <div>
                <label className={LABEL}>Ligne Budget</label>
                <Select value={form.budget_ligne_id} onChange={e => set('budget_ligne_id', e.target.value)} disabled={isReadOnly}>
                  <option value="">Aucune</option>
                  {budgetLignes.map(l => (
                    <option key={l.id} value={l.id}>{l.code_ligne} — {l.libelle}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className={LABEL}>Ligne PPM</label>
                <Input value={form.ppm_ligne_id} onChange={e => set('ppm_ligne_id', e.target.value)} placeholder="ppm-001" disabled={isReadOnly} />
              </div>
            </div>
          </div>

          {/* ── Finances ──────────────────────────────────────────── */}
          <div className={SECTION}>
            <p className={SECTION_TITLE}>Données financières</p>
            <div className={GRID2}>
              <div>
                <label className={LABEL}>Devise</label>
                <Select value={form.devise_code} onChange={e => set('devise_code', e.target.value)} disabled={isReadOnly}>
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar)</option>
                </Select>
              </div>
              <div>
                <label className={LABEL}>Taux de change contractuel</label>
                <Input
                  type="number"
                  value={form.taux_change_contractuel}
                  onChange={e => set('taux_change_contractuel', e.target.value)}
                  disabled={isReadOnly || form.devise_code === 'XOF'}
                  placeholder="1"
                />
              </div>
            </div>
            <div className={`${GRID2} mt-3`}>
              <div>
                <label className={LABEL}>Montant contractuel ({form.devise_code}) *</label>
                <Input
                  type="number"
                  value={form.montant_initial_devise}
                  onChange={e => set('montant_initial_devise', e.target.value)}
                  placeholder="0"
                  disabled={isReadOnly}
                />
                {errors.montant_initial_devise && <p className="text-xs text-destructive mt-1">{errors.montant_initial_devise}</p>}
              </div>
              <div>
                <label className={LABEL}>Montant base (XOF) — calculé</label>
                <Input
                  value={autoMontantBase.toLocaleString('fr-FR')}
                  readOnly
                  disabled
                  className="bg-muted/30 font-mono"
                />
              </div>
            </div>
          </div>

          {/* ── Dates ────────────────────────────────────────────── */}
          <div className={SECTION}>
            <p className={SECTION_TITLE}>Dates contractuelles</p>
            <div className={GRID2}>
              <div>
                <label className={LABEL}>Date de signature</label>
                <Input type="date" value={form.date_signature} onChange={e => set('date_signature', e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <label className={LABEL}>Ordre de service</label>
                <Input type="date" value={form.date_ordre_service} onChange={e => set('date_ordre_service', e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <label className={LABEL}>Début prévu</label>
                <Input type="date" value={form.debut_prevu} onChange={e => set('debut_prevu', e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <label className={LABEL}>Fin prévue</label>
                <Input type="date" value={form.fin_prevue} onChange={e => set('fin_prevue', e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <label className={LABEL}>Fin réelle</label>
                <Input type="date" value={form.fin_reelle} onChange={e => set('fin_reelle', e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <label className={LABEL}>Réception provisoire</label>
                <Input type="date" value={form.reception_provisoire} onChange={e => set('reception_provisoire', e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <label className={LABEL}>Réception définitive</label>
                <Input type="date" value={form.reception_definitive} onChange={e => set('reception_definitive', e.target.value)} disabled={isReadOnly} />
              </div>
            </div>
          </div>

          {/* ── Garanties ────────────────────────────────────────── */}
          <div className={SECTION}>
            <p className={SECTION_TITLE}>Garanties</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Bonne exécution (%)</label>
                <Input type="number" value={form.garantie_bonne_execution_taux} onChange={e => set('garantie_bonne_execution_taux', e.target.value)} placeholder="5" disabled={isReadOnly} />
              </div>
              <div>
                <label className={LABEL}>Avance (%)</label>
                <Input type="number" value={form.garantie_avance_taux} onChange={e => set('garantie_avance_taux', e.target.value)} placeholder="15" disabled={isReadOnly} />
              </div>
              <div>
                <label className={LABEL}>Retenue de garantie (%)</label>
                <Input type="number" value={form.retenue_garantie_taux} onChange={e => set('retenue_garantie_taux', e.target.value)} placeholder="5" disabled={isReadOnly} />
              </div>
            </div>
            <div className="mt-3 max-w-xs">
              <label className={LABEL}>Expiration garantie</label>
              <Input type="date" value={form.date_expiration_garantie} onChange={e => set('date_expiration_garantie', e.target.value)} disabled={isReadOnly} />
            </div>
          </div>

        </SlideOverBody>

        <SlideOverFooter className="flex items-center justify-between gap-2 px-6 py-4 border-t border-border bg-card">
          {/* Delete zone */}
          <div>
            {!isReadOnly && mode === 'edit' && contract && onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive font-medium">Supprimer ce contrat ?</span>
                  <button
                    className="text-xs font-semibold text-destructive underline underline-offset-2 hover:opacity-80"
                    onClick={handleDelete}
                  >
                    Oui
                  </button>
                  <button
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:opacity-80"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Non
                  </button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-8 text-xs gap-1.5"
                  onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={13} />
                  Supprimer
                </Button>
              )
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <SlideOverClose asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {isReadOnly ? 'Fermer' : 'Annuler'}
              </Button>
            </SlideOverClose>
            {!isReadOnly && (
              <Button variant="default" size="sm" className="h-8 text-xs" onClick={handleSave}>
                Enregistrer
              </Button>
            )}
            {isReadOnly && onSwitchToEdit && (
              <Button variant="default" size="sm" className="h-8 text-xs" onClick={onSwitchToEdit}>
                Modifier
              </Button>
            )}
          </div>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
