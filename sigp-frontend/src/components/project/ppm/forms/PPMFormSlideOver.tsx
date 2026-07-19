import React, { useState, useEffect, useMemo } from 'react';
import { Save, AlertCircle, Trash2 } from 'lucide-react';
import { PPMLigne } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/forms/Button';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
} from '@/components/ui/overlays/Modal';
import { useTasks } from '@/hooks/useTasks';
import { usePpmMarcheActivites, useSetPpmMarcheActivites } from '@/hooks/usePPM';
import { useBudget, useBudgetVersion } from '@/hooks/useBudget';
import { useFundingSources } from '@/hooks/useFundingSources';
import { useWBS } from '@/hooks/useWBS';

// Le backend (ppm_marches.statut) ne connaît que 8 valeurs, quand le type FE
// StatutLignePPM en modélise 12 (cf. feStatutToBe/beStatutToFe dans usePPM.ts).
// On ne propose ici que le sous-ensemble qui fait un aller-retour fidèle avec
// le backend, pour éviter qu'une valeur choisie (ex: CONTRAT_SIGNE) ne se
// retrouve silencieusement réétiquetée (EXECUTION) après enregistrement.
const STATUT_OPTIONS: { value: PPMLigne['statut']; label: string }[] = [
  { value: 'PLANIFIE',      label: 'Planifié' },
  { value: 'DAO_LANCE',     label: 'DAO lancé' },
  { value: 'OFFRES_RECUES', label: 'Offres reçues' },
  { value: 'EVALUATION',    label: 'Évaluation / ANO' },
  { value: 'ATTRIBUE',      label: 'Attribué' },
  { value: 'EXECUTION',     label: 'Contrat signé / En exécution' },
  { value: 'CLOTURE',       label: 'Clôturé' },
  { value: 'ANNULE',        label: 'Annulé' },
];

interface PPMFormSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  ligne?: PPMLigne | null;
  onSave: (data: Omit<PPMLigne, 'id' | 'version_hash' | 'ppm_version_id'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  projectId: string;
  canDelete?: boolean;
}

export function PPMFormSlideOver({ isOpen, onClose, ligne, onSave, onDelete, projectId, canDelete }: PPMFormSlideOverProps) {
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

  // Lignes budgétaires réelles de la version active + sources de financement
  // réelles du projet — remplacent les options figées précédentes.
  const { data: budget } = useBudget(projectId);
  const { data: budgetVersion } = useBudgetVersion(projectId, budget?.version_active_id);
  const budgetLignes = budgetVersion?.lignes ?? [];
  const { data: fundingSources } = useFundingSources(projectId);

  // Nœuds WBS terminaux réels du projet — remplacent la saisie libre
  // précédente (wbs_id n'a pas de colonne dédiée côté ppm_marches, mais doit
  // désormais référencer un vrai nœud existant, cf. audit Marchés & Contrats).
  const { data: wbsData } = useWBS(projectId);
  const terminalWbsNodes = useMemo(() => {
    const all = wbsData?.data ?? [];
    return all.filter(n => !all.some(other => other.parent_id === n.id));
  }, [wbsData]);

  // Local form state
  const [reference,     setReference]     = useState('');
  const [wbsId,         setWbsId]         = useState('');
  const [budgetLigneId, setBudgetLigneId] = useState('');
  const [description,   setDescription]   = useState('');

  const [categorie,  setCategorie]  = useState<PPMLigne['categorie']>('TRAVAUX');
  const [methode,    setMethode]    = useState<PPMLigne['methode']>('AOI');
  const [typeRevue,  setTypeRevue]  = useState<PPMLigne['type_revue']>('POST');
  const [bailleurId, setBailleurId] = useState('');
  const [statut,     setStatut]     = useState<PPMLigne['statut']>('PLANIFIE');

  const [montantDevise, setMontantDevise] = useState(0);
  const [deviseCode,    setDeviseCode]    = useState('XOF');
  const [tauxChange,    setTauxChange]    = useState(1);

  // Attribution — renseignés une fois le marché attribué/signé (colonnes
  // réelles ppm_marches.montant_signe/titulaire/date_fin_effective)
  const [montantSigne,     setMontantSigne]     = useState('');
  const [titulaire,        setTitulaire]        = useState('');
  const [dateFinEffective, setDateFinEffective] = useState('');

  const [dates, setDates] = useState({
    preparation_dao_prevue:       '',
    lancement_dao_prevue:         '',
    remise_offres_prevue:         '',
    ouverture_evaluation_prevue:  '',
    avis_non_objection_prevue:    '',
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
      setStatut(ligne.statut);
      setMontantDevise(ligne.montant_estime_devise);
      setDeviseCode(ligne.devise_code);
      setTauxChange(ligne.taux_change_estime);
      setMontantSigne(ligne.montant_signe != null ? String(ligne.montant_signe) : '');
      setTitulaire(ligne.titulaire ?? '');
      setDateFinEffective(ligne.date_fin_effective ?? '');
      setDates({
        preparation_dao_prevue:      ligne.dates_cles.preparation_dao_prevue      || '',
        lancement_dao_prevue:        ligne.dates_cles.lancement_dao_prevue        || '',
        remise_offres_prevue:        ligne.dates_cles.remise_offres_prevue        || '',
        ouverture_evaluation_prevue: ligne.dates_cles.ouverture_evaluation_prevue || '',
        avis_non_objection_prevue:   ligne.dates_cles.avis_non_objection_prevue   || '',
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
      setStatut('PLANIFIE');
      setMontantDevise(0);
      setDeviseCode('XOF');
      setTauxChange(1);
      setMontantSigne('');
      setTitulaire('');
      setDateFinEffective('');
      setDates({
        preparation_dao_prevue: '', lancement_dao_prevue: '', remise_offres_prevue: '',
        ouverture_evaluation_prevue: '', avis_non_objection_prevue: '', attribution_prevue: '',
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
        statut,
        montant_estime_devise: montantDevise,
        devise_code:          deviseCode,
        taux_change_estime:   tauxChange,
        montant_estime_base:  montantBase,
        montant_signe:        montantSigne ? Number(montantSigne) : undefined,
        titulaire:            titulaire.trim() || undefined,
        date_fin_effective:   dateFinEffective || undefined,
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

  const INPUT_CLASS = 'w-full h-9 px-3 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50';
  const LABEL_CLASS = 'block text-sm font-medium text-foreground mb-1';
  const SECTION_CLASS = 'text-xs font-bold text-foreground uppercase tracking-wider mb-4 border-b border-border pb-2';

  return (
    <Modal open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>
            {ligne ? 'Modifier la ligne de marché' : 'Nouvelle ligne de marché'}
          </ModalTitle>
        </ModalHeader>

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
                  <select
                    id="ppm-wbs"
                    required
                    className={INPUT_CLASS}
                    value={wbsId}
                    onChange={e => setWbsId(e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    {terminalWbsNodes.map(n => (
                      <option key={n.id} value={n.id}>{n.code_wbs} — {n.titre}</option>
                    ))}
                  </select>
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
                    {budgetLignes.map(l => (
                      <option key={l.id} value={l.id}>{l.code_ligne} — {l.libelle}</option>
                    ))}
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
                    {(fundingSources ?? []).map(f => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-statut">Statut *</label>
                  <select
                    id="ppm-statut"
                    required
                    className={INPUT_CLASS}
                    value={statut}
                    onChange={e => setStatut(e.target.value as PPMLigne['statut'])}
                  >
                    {STATUT_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
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
                  <span className="font-medium">
                    Solde disponible ({budgetLignes.find(l => l.id === budgetLigneId)?.code_ligne ?? budgetLigneId}) :
                  </span>
                  <span className="font-mono font-bold">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(soldeDisponible)}
                  </span>
                </div>
              )}
            </section>

            {/* Section 4: Attribution (post-attribution, optionnel) */}
            <section>
              <h3 className={SECTION_CLASS}>Attribution</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={LABEL_CLASS} htmlFor="ppm-titulaire">Titulaire (attributaire)</label>
                  <input
                    id="ppm-titulaire"
                    type="text"
                    className={INPUT_CLASS}
                    value={titulaire}
                    onChange={e => setTitulaire(e.target.value)}
                    placeholder="Entreprise attributaire du marché"
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-montant-signe">Montant Signé (XOF)</label>
                  <input
                    id="ppm-montant-signe"
                    type="number"
                    min="0"
                    className={INPUT_CLASS}
                    value={montantSigne}
                    onChange={e => setMontantSigne(e.target.value)}
                    placeholder="Montant réellement contracté"
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-date-fin-eff">Date de fin effective</label>
                  <input
                    id="ppm-date-fin-eff"
                    type="date"
                    className={INPUT_CLASS}
                    value={dateFinEffective}
                    onChange={e => setDateFinEffective(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Section 5: Chronogramme */}
            <section>
              <h3 className={SECTION_CLASS}>Chronogramme Prévisionnel</h3>
              <div className="grid grid-cols-2 gap-4">
                {(Object.entries({
                  preparation_dao_prevue:      'Préparation DAO',
                  lancement_dao_prevue:        'Lancement DAO',
                  remise_offres_prevue:        'Remise des Offres',
                  ouverture_evaluation_prevue: 'Évaluation',
                  // ANO (avis de non-objection) uniquement pertinent en revue
                  // préalable — c'est en POST qu'il n'y a justement pas d'ANO
                  // avant attribution.
                  ...(typeRevue === 'PRIOR' ? { avis_non_objection_prevue: 'ANO Bailleur' } : {}),
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
        <div className="px-6 py-4 border-t border-border bg-muted/5 flex justify-between items-center gap-3 shrink-0">
          {ligne && onDelete && canDelete ? (
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
      </ModalContent>
    </Modal>
  );
}
