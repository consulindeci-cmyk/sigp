import React, { useState, useEffect, useMemo } from 'react';
import { Save, AlertCircle, Trash2 } from 'lucide-react';
import { PPMLigne, CategorieAchat, MethodePassation } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/forms/Button';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
} from '@/components/ui/overlays/Modal';
import { usePPM } from '@/hooks/usePPM';
import { useBudget, useBudgetVersion } from '@/hooks/useBudget';
import { useWBS } from '@/hooks/useWBS';
import { useProject } from '@/hooks/useProjects';

const CATEGORIE_OPTIONS: { value: CategorieAchat; label: string }[] = [
  { value: 'TRAVAUX',                  label: 'Travaux' },
  { value: 'BIENS',                    label: 'Fournitures' },
  { value: 'SERVICES_CONSULTANTS',     label: 'Services de consultants' },
  { value: 'SERVICES_NON_CONSULTANTS', label: 'Services autres' },
];

const METHODE_OPTIONS: { value: MethodePassation; label: string }[] = [
  { value: 'AOI',  label: 'AOI — Appel d\'offres international' },
  { value: 'AON',  label: 'AON — Appel d\'offres national' },
  { value: 'QCBS', label: 'QCBS — Qualité-coût (consultants)' },
  { value: 'LCS',  label: 'LCS — Moindre coût' },
  { value: 'CF',   label: 'Demande de prix' },
  { value: 'ED',   label: 'Entente directe' },
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
  const [touched,          setTouched]         = useState(false);

  // Lignes budgétaires réelles de la version active — le bailleur/source de
  // financement n'est plus saisi directement dans ce formulaire : il est
  // hérité de la ligne budgétaire rattachée (cf. bailleur_id de la ligne,
  // déjà résolu par useBudget.ts depuis la vraie colonne funding_source_id).
  const { data: budget } = useBudget(projectId);
  const { data: budgetVersion } = useBudgetVersion(projectId, budget?.version_active_id);
  const budgetLignes = budgetVersion?.lignes ?? [];

  // Marchés déjà existants du projet — sert uniquement à générer la
  // référence par défaut (PPM-AAAA-XXX, compteur annuel).
  const { lignes: existingLignes, isLoading: isLoadingExisting } = usePPM(projectId);
  const suggestedReference = useMemo(() => {
    const year = new Date().getFullYear();
    const prefix = `PPM-${year}-`;
    const maxNum = existingLignes.reduce((max, l) => {
      if (!l.reference_marche.startsWith(prefix)) return max;
      const num = parseInt(l.reference_marche.slice(prefix.length), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  }, [existingLignes]);

  // Devise du projet — la seule utilisée désormais pour le Montant Estimé,
  // plus de sélecteur de devise ni de taux de change (cf. audit PPM :
  // le formulaire mélangeait des devises sans que la Matrice n'en tienne
  // compte de façon cohérente).
  const { data: project } = useProject(projectId);
  const projectDevise = project?.devise || 'XOF';

  // Nœuds WBS terminaux réels du projet (activités filles, jamais une
  // composante racine — le WBS de ce projet est strictement à 2 niveaux,
  // donc "sans enfant" et "non-racine" désignent le même ensemble ici).
  const { data: wbsData } = useWBS(projectId);
  const terminalWbsNodes = useMemo(() => {
    const all = wbsData?.data ?? [];
    return all.filter(n => !all.some(other => other.parent_id === n.id));
  }, [wbsData]);

  // ── Local form state ──────────────────────────────────────────────────────
  const [reference,     setReference]     = useState('');
  const [wbsId,         setWbsId]         = useState('');
  const [budgetLigneId, setBudgetLigneId] = useState('');
  const [description,   setDescription]   = useState('');

  // Filtrage en cascade : seules les lignes budgétaires réellement rattachées
  // à l'activité WBS sélectionnée sont proposées (jamais de mismatch WBS ↔
  // Ligne Budgétaire possible côté PPM).
  const filteredBudgetLignes = useMemo(
    () => wbsId ? budgetLignes.filter(l => l.wbs_id === wbsId) : [],
    [budgetLignes, wbsId],
  );

  // Changer d'activité WBS invalide le choix de Ligne Budgétaire précédent
  // (potentiellement rattaché à une autre activité) — jamais silencieusement
  // conservé.
  function handleWbsChange(newWbsId: string) {
    setWbsId(newWbsId);
    setBudgetLigneId('');
  }

  const [categorie,  setCategorie]  = useState<PPMLigne['categorie']>('TRAVAUX');
  const [methode,    setMethode]    = useState<PPMLigne['methode']>('AOI');
  const [typeRevue,  setTypeRevue]  = useState<PPMLigne['type_revue']>('POST');

  const [montantDevise, setMontantDevise] = useState(0);

  // Bailleur hérité de la ligne budgétaire rattachée (funding_source_id réel,
  // cf. useBudget.ts) — plus de sélecteur dédié dans ce formulaire.
  const derivedBailleurId = budgetLignes.find(l => l.id === budgetLigneId)?.bailleur_id || '';

  // ── Champs conservés en arrière-plan (retirés de l'UI par cette
  // restructuration mais PAS supprimés en base) : le Statut (workflow de
  // passation), les informations d'Attribution (titulaire/montant signé/date
  // fin effective) et 6 des 8 dates du chronogramme correspondent à de
  // vraies colonnes ppm_marches — les masquer sans les préserver aurait
  // silencieusement écrasé ces valeurs à la moindre modification d'un
  // marché existant. Initialisées depuis `ligne` comme avant, simplement
  // plus rendues à l'écran.
  const [statut,           setStatut]           = useState<PPMLigne['statut']>('PLANIFIE');
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
      setStatut(ligne.statut);
      setMontantDevise(ligne.montant_estime_devise);
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
      setStatut('PLANIFIE');
      setMontantDevise(0);
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
    setTouched(false);
    setConfirmingDelete(false);
  }, [ligne, isOpen]);

  // Référence par défaut à la création — n'écrase jamais une saisie déjà
  // commencée par l'utilisateur (le champ reste éditable) ; attend la fin du
  // chargement des marchés existants pour ne pas suggérer un compteur en
  // retard sur la réalité (ex: "001" avant que la vraie liste n'ait chargé).
  useEffect(() => {
    if (isOpen && !ligne && !isLoadingExisting && !reference.trim()) {
      setReference(suggestedReference);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ligne, isLoadingExisting, suggestedReference]);

  // Fetch available budget for UI feedback (formule identique à
  // useBudget.ts : solde_disponible = max(0, montant_prevu - montant_engage)).
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

  const isValid = !!reference.trim() && !!wbsId && !!budgetLigneId && !!description.trim() && montantDevise > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
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
        bailleur_id:          derivedBailleurId,
        statut,
        montant_estime_devise: montantDevise,
        devise_code:          projectDevise,
        taux_change_estime:   1,
        montant_estime_base:  montantDevise,
        montant_signe:        montantSigne ? Number(montantSigne) : undefined,
        titulaire:            titulaire.trim() || undefined,
        date_fin_effective:   dateFinEffective || undefined,
        dates_cles:           dates,
      });
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
  const ERROR_INPUT_CLASS = 'border-destructive focus:ring-destructive';
  const LABEL_CLASS = 'block text-sm font-medium text-foreground mb-1';
  const SECTION_CLASS = 'text-xs font-bold text-foreground uppercase tracking-wider mb-4 border-b border-border pb-2';
  const ERR_CLASS = 'mt-1 text-xs text-destructive';

  const fieldClass = (invalid: boolean) => `${INPUT_CLASS}${invalid ? ` ${ERROR_INPUT_CLASS}` : ''}`;

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

            {/* Section 1 : Identification & Rattachement */}
            <section>
              <h3 className={SECTION_CLASS}>Identification &amp; Rattachement</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={LABEL_CLASS} htmlFor="ppm-ref">Référence du marché *</label>
                  <input
                    id="ppm-ref"
                    type="text"
                    className={fieldClass(touched && !reference.trim())}
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Ex: AOI-001/2026"
                  />
                  {touched && !reference.trim() && <p className={ERR_CLASS}>Référence requise.</p>}
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLASS} htmlFor="ppm-desc">Description / Intitulé du marché *</label>
                  <textarea
                    id="ppm-desc"
                    className={`${fieldClass(touched && !description.trim())} h-auto min-h-[80px] py-2 resize-y`}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                  {touched && !description.trim() && <p className={ERR_CLASS}>Description requise.</p>}
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-wbs">Rattachement WBS (Activité fille) *</label>
                  <select
                    id="ppm-wbs"
                    className={fieldClass(touched && !wbsId)}
                    value={wbsId}
                    onChange={e => handleWbsChange(e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    {terminalWbsNodes.map(n => (
                      <option key={n.id} value={n.id}>{n.code_wbs} — {n.titre}</option>
                    ))}
                  </select>
                  {touched && !wbsId && <p className={ERR_CLASS}>Activité WBS requise.</p>}
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-budget-ligne">Ligne Budgétaire *</label>
                  <select
                    id="ppm-budget-ligne"
                    className={fieldClass(touched && !budgetLigneId)}
                    value={budgetLigneId}
                    onChange={e => setBudgetLigneId(e.target.value)}
                    disabled={!wbsId}
                  >
                    <option value="">
                      {!wbsId ? 'Sélectionnez d\'abord une activité WBS' : '-- Sélectionner --'}
                    </option>
                    {filteredBudgetLignes.map(l => (
                      <option key={l.id} value={l.id}>{l.code_ligne} — {l.libelle}</option>
                    ))}
                  </select>
                  {touched && !budgetLigneId && <p className={ERR_CLASS}>Ligne budgétaire requise.</p>}
                  {wbsId && filteredBudgetLignes.length === 0 && (
                    <p className="mt-1 text-xs text-warning">Aucune ligne budgétaire disponible pour cette activité.</p>
                  )}
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-categorie">Type de marché *</label>
                  <select
                    id="ppm-categorie"
                    className={INPUT_CLASS}
                    value={categorie}
                    onChange={e => setCategorie(e.target.value as PPMLigne['categorie'])}
                  >
                    {CATEGORIE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Section 2 : Méthode & Configuration Bailleur */}
            <section>
              <h3 className={SECTION_CLASS}>Méthode &amp; Configuration Bailleur</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-methode">Méthode d'acquisition *</label>
                  <select
                    id="ppm-methode"
                    className={INPUT_CLASS}
                    value={methode}
                    onChange={e => setMethode(e.target.value as PPMLigne['methode'])}
                  >
                    {METHODE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-revue">Revue bailleur *</label>
                  <select
                    id="ppm-revue"
                    className={INPUT_CLASS}
                    value={typeRevue}
                    onChange={e => setTypeRevue(e.target.value as PPMLigne['type_revue'])}
                  >
                    <option value="PRIOR">A priori</option>
                    <option value="POST">A posteriori</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section 3 : Calendrier & Jalons */}
            <section>
              <h3 className={SECTION_CLASS}>Calendrier &amp; Jalons</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-date-avis">Date Avis / Publication</label>
                  <input
                    id="ppm-date-avis"
                    type="date"
                    className={INPUT_CLASS}
                    value={dates.lancement_dao_prevue}
                    onChange={e => setDates(prev => ({ ...prev, lancement_dao_prevue: e.target.value }))}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Avis Général ou Avis Spécifique selon la méthode retenue.</p>
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-date-signature">Date Signature du Contrat</label>
                  <input
                    id="ppm-date-signature"
                    type="date"
                    className={INPUT_CLASS}
                    value={dates.signature_contrat_prevue}
                    onChange={e => setDates(prev => ({ ...prev, signature_contrat_prevue: e.target.value }))}
                  />
                </div>
              </div>
            </section>

            {/* Section 4 : Montant Estimé */}
            <section>
              <h3 className={SECTION_CLASS}>Montant Estimé</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS} htmlFor="ppm-montant">Montant Estimé ({projectDevise}) *</label>
                  <input
                    id="ppm-montant"
                    type="number"
                    min="0"
                    className={fieldClass(touched && montantDevise <= 0)}
                    value={montantDevise}
                    onChange={e => setMontantDevise(Number(e.target.value))}
                  />
                  {touched && montantDevise <= 0 && <p className={ERR_CLASS}>Montant requis (&gt; 0).</p>}
                </div>
              </div>

              {/* Feedback Budgétaire */}
              {soldeDisponible !== null && (
                <div className={`mt-4 p-3 rounded-md text-sm border flex items-center justify-between ${
                  montantDevise > soldeDisponible
                    ? 'bg-destructive/10 border-destructive/20 text-destructive'
                    : 'bg-success/10 border-success/20 text-success'
                }`}>
                  <span className="font-medium">
                    Solde disponible ({budgetLignes.find(l => l.id === budgetLigneId)?.code_ligne ?? budgetLigneId}) :
                  </span>
                  <span className="font-mono font-bold">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: projectDevise }).format(soldeDisponible)}
                  </span>
                </div>
              )}
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
