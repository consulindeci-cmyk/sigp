import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, AlertCircle, Trash2 } from 'lucide-react';
import { PPMLigne } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/forms/Button';
import { useTasks } from '@/hooks/useTasks';
import { usePpmMarcheActivites, useSetPpmMarcheActivites } from '@/hooks/usePPM';

interface PPMFormSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  ligne?: PPMLigne | null;
  onSave: (data: Omit<PPMLigne, 'id' | 'version_hash' | 'statut' | 'ppm_version_id'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  projectId: string;
}

export function PPMFormSlideOver({ isOpen, onClose, ligne, onSave, onDelete, projectId }: PPMFormSlideOverProps) {
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Activités PTBA liées à ce marché (many-to-many) — uniquement pertinent
  // une fois le marché créé (besoin de son id réel).
  const { data: tasksData } = useTasks(projectId, { limit: 200 });
  const projectActivites = useMemo(() => tasksData?.data ?? [], [tasksData]);
  const { data: linkedActivites } = usePpmMarcheActivites(ligne?.id ?? '');
  const setActivitesMutation = useSetPpmMarcheActivites();
  const [selectedActiviteIds, setSelectedActiviteIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedActiviteIds((linkedActivites ?? []).map(a => a.id));
  }, [linkedActivites]);

  function toggleActivite(id: string) {
    setSelectedActiviteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // Local form state
  const [reference,     setReference]     = useState('');
  const [wbsId,         setWbsId]         = useState('');
  const [budgetLigneId, setBudgetLigneId] = useState('');
  const [description,   setDescription]   = useState('');

  const [categorie,  setCategorie]  = useState<PPMLigne['categorie']>('TRAVAUX');
  const [methode,    setMethode]    = useState<PPMLigne['methode']>('AOI');
  const [typeRevue,  setTypeRevue]  = useState<PPMLigne['type_revue']>('POST');
  const [bailleurId, setBailleurId] = useState('');

  const [montantDevise, setMontantDevise] = useState(0);
  const [deviseCode,    setDeviseCode]    = useState('XOF');
  const [tauxChange,    setTauxChange]    = useState(1);

  const [dates, setDates] = useState({
    preparation_dao_prevue:       '',
    lancement_dao_prevue:         '',
    remise_offres_prevue:         '',
    ouverture_evaluation_prevue:  '',
    attribution_prevue:           '',
    signature_contrat_prevue:     '',
    demarrage_prevue:             '',
  });

  const [soldeDisponible, setSoldeDisponible] = useState<number | null>(null);

  // Initialize form when ligne changes
  useEffect(() => {
    if (ligne) {
      setReference(ligne.reference_marche);
      setWbsId(ligne.wbs_id);
      setBudgetLigneId(ligne.budget_ligne_id);
      setDescription(ligne.description);
      setCategorie(ligne.categorie);
      setMethode(ligne.methode);
      setTypeRevue(ligne.type_revue);
      setBailleurId(ligne.bailleur_id);
      setMontantDevise(ligne.montant_estime_devise);
      setDeviseCode(ligne.devise_code);
      setTauxChange(ligne.taux_change_estime);
      setDates({
        preparation_dao_prevue:      ligne.dates_cles.preparation_dao_prevue      || '',
        lancement_dao_prevue:        ligne.dates_cles.lancement_dao_prevue        || '',
        remise_offres_prevue:        ligne.dates_cles.remise_offres_prevue        || '',
        ouverture_evaluation_prevue: ligne.dates_cles.ouverture_evaluation_prevue || '',
        attribution_prevue:          ligne.dates_cles.attribution_prevue          || '',
        signature_contrat_prevue:    ligne.dates_cles.signature_contrat_prevue    || '',
        demarrage_prevue:            ligne.dates_cles.demarrage_prevue            || '',
      });
    } else {
      setReference('');
      setWbsId('');
      setBudgetLigneId('');
      setDescription('');
      setCategorie('TRAVAUX');
      setMethode('AOI');
      setTypeRevue('POST');
      setBailleurId('');
      setMontantDevise(0);
      setDeviseCode('XOF');
      setTauxChange(1);
      setDates({
        preparation_dao_prevue: '', lancement_dao_prevue: '', remise_offres_prevue: '',
        ouverture_evaluation_prevue: '', attribution_prevue: '',
        signature_contrat_prevue: '', demarrage_prevue: '',
      });
    }
    setError(null);
    setConfirmingDelete(false);
  }, [ligne, isOpen]);

  // Fetch available budget for UI feedback.
  // NOTE : appelait /budget-lignes/:id/solde, une route qui n'a jamais existé
  // côté NestJS — ce feedback était donc toujours silencieusement absent.
  // Calcul réel ici, fidèle à la formule déjà établie dans useBudget.ts
  // (solde_disponible = max(0, montant_prevu - montant_engage)).
  useEffect(() => {
    if (!budgetLigneId) { setSoldeDisponible(null); return; }
    supabase
      .from('budget_lignes')
      .select('montant_prevu, montant_engage')
      .eq('id', budgetLigneId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setSoldeDisponible(null); return; }
        const prevu = Number(data.montant_prevu ?? 0);
        const engage = Number(data.montant_engage ?? 0);
        setSoldeDisponible(Math.max(0, prevu - engage));
      });
  }, [budgetLigneId]);

  const montantBase = montantDevise * tauxChange;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        reference_marche:     reference,
        wbs_id:               wbsId,
        budget_ligne_id:      budgetLigneId,
        description,
        categorie,
        methode,
        type_revue:           typeRevue,
        bailleur_id:          bailleurId,
        montant_estime_devise: montantDevise,
        devise_code:          deviseCode,
        taux_change_estime:   tauxChange,
        montant_estime_base:  montantBase,
        est_lot_unique:       true,
        dates_cles:           dates,
      });
      if (ligne) {
        await setActivitesMutation.mutateAsync({ marcheId: ligne.id, activiteIds: selectedActiviteIds });
      }
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!ligne || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(ligne.id);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur lors de la suppression');
    } finally {
      setIsSubmitting(false);
      setConfirmingDelete(false);
    }
  };

  if (!isOpen) return null;

  const INPUT_CLASS = 'w-full h-9 px-3 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50';
  const LABEL_CLASS = 'block text-sm font-medium text-foreground mb-1';
  const SECTION_CLASS = 'text-xs font-bold text-foreground uppercase tracking-wider mb-4 border-b border-border pb-2';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-card border-l border-border shadow-xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ppm-form-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <h2 id="ppm-form-title" className="text-base font-bold text-foreground">
            {ligne ? 'Modifier la ligne de marché' : 'Nouvelle ligne de marché'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 text-destructive">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form id="ppm-form" onSubmit={handleSubmit} className="space-y-8">

            {/* Section 1: Identification */}
            <section>
              <h3 className={SECTION_CLASS}>Identification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-ref">Référence du marché *</label>
                  <input
                    id="ppm-ref"
                    required
                    type="text"
                    className={INPUT_CLASS}
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Ex: AOI-001/2026"
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-wbs">WBS *</label>
                  <input
                    id="ppm-wbs"
                    required
                    type="text"
                    className={INPUT_CLASS}
                    value={wbsId}
                    onChange={e => setWbsId(e.target.value)}
                    placeholder="wbs-1-1"
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLASS} htmlFor="ppm-desc">Description *</label>
                  <textarea
                    id="ppm-desc"
                    required
                    className={`${INPUT_CLASS} h-auto min-h-[80px] py-2 resize-y`}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLASS} htmlFor="ppm-budget-ligne">Ligne Budgétaire (Source) *</label>
                  <select
                    id="ppm-budget-ligne"
                    required
                    className={INPUT_CLASS}
                    value={budgetLigneId}
                    onChange={e => setBudgetLigneId(e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="bl-1">Budget Ligne 1 (Travaux)</option>
                    <option value="bl-2">Budget Ligne 2 (Services)</option>
                    <option value="bl-3">Budget Ligne 3 (Épuisée)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLASS}>Activités PTBA couvertes</label>
                  {!ligne ? (
                    <p className="text-xs text-muted-foreground italic">
                      Disponible après l'enregistrement de la ligne de marché.
                    </p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-border rounded-md divide-y divide-border">
                      {projectActivites.length === 0 && (
                        <p className="text-xs text-muted-foreground p-3">Aucune activité PTBA sur ce projet.</p>
                      )}
                      {projectActivites.map(a => (
                        <label key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                          <input
                            type="checkbox"
                            checked={selectedActiviteIds.includes(a.id)}
                            onChange={() => toggleActivite(a.id)}
                          />
                          <span className="font-mono text-xs text-muted-foreground">{a.code_tache}</span>
                          <span className="text-foreground truncate">{a.description}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Configuration */}
            <section>
              <h3 className={SECTION_CLASS}>Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-categorie">Catégorie *</label>
                  <select
                    id="ppm-categorie"
                    required
                    className={INPUT_CLASS}
                    value={categorie}
                    onChange={e => setCategorie(e.target.value as PPMLigne['categorie'])}
                  >
                    <option value="TRAVAUX">Travaux</option>
                    <option value="BIENS">Biens</option>
                    <option value="SERVICES_CONSULTANTS">Services Consultants</option>
                    <option value="SERVICES_NON_CONSULTANTS">Services Non Consultants</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-methode">Méthode *</label>
                  <select
                    id="ppm-methode"
                    required
                    className={INPUT_CLASS}
                    value={methode}
                    onChange={e => setMethode(e.target.value as PPMLigne['methode'])}
                  >
                    <option value="AOI">AOI</option>
                    <option value="AON">AON</option>
                    <option value="QCBS">QCBS</option>
                    <option value="CF">CF</option>
                    <option value="ED">ED</option>
                    <option value="LCS">LCS</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-revue">Type de revue *</label>
                  <select
                    id="ppm-revue"
                    required
                    className={INPUT_CLASS}
                    value={typeRevue}
                    onChange={e => setTypeRevue(e.target.value as PPMLigne['type_revue'])}
                  >
                    <option value="PRIOR">À Priori (PRIOR)</option>
                    <option value="POST">À Posteriori (POST)</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-bailleur">Bailleur *</label>
                  <select
                    id="ppm-bailleur"
                    required
                    className={INPUT_CLASS}
                    value={bailleurId}
                    onChange={e => setBailleurId(e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="b-ida">IDA (Banque Mondiale)</option>
                    <option value="b-afd">AFD</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section 3: Finances */}
            <section>
              <h3 className={SECTION_CLASS}>Données Financières</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-devise">Devise *</label>
                  <select
                    id="ppm-devise"
                    required
                    className={INPUT_CLASS}
                    value={deviseCode}
                    onChange={e => setDeviseCode(e.target.value)}
                  >
                    <option value="XOF">XOF (FCFA)</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-taux">Taux de change (vers XOF) *</label>
                  <input
                    id="ppm-taux"
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    className={INPUT_CLASS}
                    value={tauxChange}
                    onChange={e => setTauxChange(Number(e.target.value))}
                    disabled={deviseCode === 'XOF'}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-montant">Montant Estimé (Devise) *</label>
                  <input
                    id="ppm-montant"
                    required
                    type="number"
                    min="0"
                    className={INPUT_CLASS}
                    value={montantDevise}
                    onChange={e => setMontantDevise(Number(e.target.value))}
                  />
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Montant Base (XOF)
                  </p>
                  <p className="font-mono text-base font-bold text-foreground">
                    {new Intl.NumberFormat('fr-FR').format(montantBase)}
                  </p>
                </div>
              </div>

              {/* Feedback Budgétaire */}
              {soldeDisponible !== null && (
                <div className={`mt-4 p-3 rounded-md text-sm border flex items-center justify-between ${
                  montantBase > soldeDisponible
                    ? 'bg-destructive/10 border-destructive/20 text-destructive'
                    : 'bg-success/10 border-success/20 text-success'
                }`}>
                  <span className="font-medium">Solde disponible ({budgetLigneId}) :</span>
                  <span className="font-mono font-bold">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(soldeDisponible)}
                  </span>
                </div>
              )}
            </section>

            {/* Section 4: Chronogramme */}
            <section>
              <h3 className={SECTION_CLASS}>Chronogramme Prévisionnel</h3>
              <div className="grid grid-cols-2 gap-4">
                {(Object.entries({
                  preparation_dao_prevue:      'Préparation DAO',
                  lancement_dao_prevue:        'Lancement DAO',
                  remise_offres_prevue:        'Remise des Offres',
                  ouverture_evaluation_prevue: 'Évaluation',
                  attribution_prevue:          'Attribution',
                  signature_contrat_prevue:    'Signature Contrat',
                  demarrage_prevue:            'Démarrage',
                }) as [keyof typeof dates, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className={`${LABEL_CLASS} text-xs`} htmlFor={`ppm-date-${key}`}>{label}</label>
                    <input
                      id={`ppm-date-${key}`}
                      type="date"
                      className={INPUT_CLASS}
                      value={dates[key]}
                      onChange={e => setDates(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </section>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/5 flex justify-between items-center gap-3">
          {ligne && onDelete ? (
            confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive font-semibold">Confirmer la suppression ?</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isSubmitting}
                >
                  Non
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '...' : 'Oui, supprimer'}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setConfirmingDelete(true)}
                disabled={isSubmitting}
                leftIcon={<Trash2 size={14} />}
              >
                Supprimer
              </Button>
            )
          ) : <div />}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="ppm-form"
              variant="default"
              size="sm"
              disabled={isSubmitting}
              leftIcon={<Save size={14} />}
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
