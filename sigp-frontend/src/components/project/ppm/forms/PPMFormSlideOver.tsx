import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Trash2 } from 'lucide-react';
import { PPMLigne } from '@/types';
import { budgetValidationService } from '@/services/budgetValidationService';

interface PPMFormSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  ligne?: PPMLigne | null;
  onSave: (data: Omit<PPMLigne, 'id' | 'version_hash' | 'statut' | 'ppm_version_id'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function PPMFormSlideOver({ isOpen, onClose, ligne, onSave, onDelete }: PPMFormSlideOverProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local form state
  const [reference, setReference] = useState('');
  const [wbsId, setWbsId] = useState('');
  const [budgetLigneId, setBudgetLigneId] = useState('');
  const [description, setDescription] = useState('');
  
  const [categorie, setCategorie] = useState<PPMLigne['categorie']>('TRAVAUX');
  const [methode, setMethode] = useState<PPMLigne['methode']>('AOI');
  const [typeRevue, setTypeRevue] = useState<PPMLigne['type_revue']>('POST');
  const [bailleurId, setBailleurId] = useState('');
  
  const [montantDevise, setMontantDevise] = useState(0);
  const [deviseCode, setDeviseCode] = useState('XOF');
  const [tauxChange, setTauxChange] = useState(1);
  
  const [dates, setDates] = useState({
    preparation_dao_prevue: '',
    lancement_dao_prevue: '',
    remise_offres_prevue: '',
    ouverture_evaluation_prevue: '',
    attribution_prevue: '',
    signature_contrat_prevue: '',
    demarrage_prevue: ''
  });

  // UI state for budget display
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
        preparation_dao_prevue: ligne.dates_cles.preparation_dao_prevue || '',
        lancement_dao_prevue: ligne.dates_cles.lancement_dao_prevue || '',
        remise_offres_prevue: ligne.dates_cles.remise_offres_prevue || '',
        ouverture_evaluation_prevue: ligne.dates_cles.ouverture_evaluation_prevue || '',
        attribution_prevue: ligne.dates_cles.attribution_prevue || '',
        signature_contrat_prevue: ligne.dates_cles.signature_contrat_prevue || '',
        demarrage_prevue: ligne.dates_cles.demarrage_prevue || ''
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
        preparation_dao_prevue: '',
        lancement_dao_prevue: '',
        remise_offres_prevue: '',
        ouverture_evaluation_prevue: '',
        attribution_prevue: '',
        signature_contrat_prevue: '',
        demarrage_prevue: ''
      });
    }
    setError(null);
  }, [ligne, isOpen]);

  // Fetch available budget for UI feedback when budgetLigneId changes
  useEffect(() => {
    if (budgetLigneId) {
      budgetValidationService.getSoldeDisponible(budgetLigneId).then(solde => {
        setSoldeDisponible(solde);
      });
    } else {
      setSoldeDisponible(null);
    }
  }, [budgetLigneId]);

  const montantBase = montantDevise * tauxChange;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSave({
        reference_marche: reference,
        wbs_id: wbsId,
        budget_ligne_id: budgetLigneId,
        description,
        categorie,
        methode,
        type_revue: typeRevue,
        bailleur_id: bailleurId,
        montant_estime_devise: montantDevise,
        devise_code: deviseCode,
        taux_change_estime: tauxChange,
        montant_estime_base: montantBase,
        est_lot_unique: true,
        dates_cles: dates
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (ligne && onDelete && window.confirm('Voulez-vous vraiment supprimer cette ligne ?')) {
      setIsSubmitting(true);
      try {
        await onDelete(ligne.id);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la suppression');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">
            {ligne ? 'Modifier la ligne de marché' : 'Nouvelle ligne de marché'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          <form id="ppm-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Identification */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Identification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Référence du marché *</label>
                  <input required type="text" className="input w-full" value={reference} onChange={e => setReference(e.target.value)} placeholder="Ex: AOI-001/2026" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WBS *</label>
                  <input required type="text" className="input w-full" value={wbsId} onChange={e => setWbsId(e.target.value)} placeholder="wbs-1-1" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                  <textarea required className="input w-full min-h-[80px]" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ligne Budgétaire (Source) *</label>
                  <select required className="input w-full" value={budgetLigneId} onChange={e => setBudgetLigneId(e.target.value)}>
                    <option value="">-- Sélectionner --</option>
                    <option value="bl-1">Budget Ligne 1 (Travaux)</option>
                    <option value="bl-2">Budget Ligne 2 (Services)</option>
                    <option value="bl-3">Budget Ligne 3 (Épuisée)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section 2: Configuration */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie *</label>
                  <select required className="input w-full" value={categorie} onChange={e => setCategorie(e.target.value as any)}>
                    <option value="TRAVAUX">Travaux</option>
                    <option value="BIENS">Biens</option>
                    <option value="SERVICES_CONSULTANTS">Services Consultants</option>
                    <option value="SERVICES_NON_CONSULTANTS">Services Non Consultants</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Méthode *</label>
                  <select required className="input w-full" value={methode} onChange={e => setMethode(e.target.value as any)}>
                    <option value="AOI">AOI</option>
                    <option value="AON">AON</option>
                    <option value="QCBS">QCBS</option>
                    <option value="CF">CF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Revue *</label>
                  <select required className="input w-full" value={typeRevue} onChange={e => setTypeRevue(e.target.value as any)}>
                    <option value="PRIOR">A Priori (PRIOR)</option>
                    <option value="POST">A Posteriori (POST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bailleur *</label>
                  <select required className="input w-full" value={bailleurId} onChange={e => setBailleurId(e.target.value)}>
                    <option value="">-- Sélectionner --</option>
                    <option value="b-ida">IDA (Banque Mondiale)</option>
                    <option value="b-afd">AFD</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section 3: Finances */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Données Financières</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Devise *</label>
                  <select required className="input w-full" value={deviseCode} onChange={e => setDeviseCode(e.target.value)}>
                    <option value="XOF">XOF</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Taux de change (vers XOF) *</label>
                  <input required type="number" min="1" step="0.01" className="input w-full" value={tauxChange} onChange={e => setTauxChange(Number(e.target.value))} disabled={deviseCode === 'XOF'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Montant Estimé (Devise) *</label>
                  <input required type="number" min="0" className="input w-full" value={montantDevise} onChange={e => setMontantDevise(Number(e.target.value))} />
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Montant Base (XOF)</label>
                  <div className="font-mono text-lg font-bold text-slate-900">
                    {new Intl.NumberFormat('fr-FR').format(montantBase)}
                  </div>
                </div>
              </div>
              
              {/* Feedback Budgétaire UI */}
              {soldeDisponible !== null && (
                <div className={`mt-4 p-3 rounded-md text-sm border flex items-center justify-between ${montantBase > soldeDisponible ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  <span className="font-medium">Solde Budgétaire Ligne ({budgetLigneId}) :</span>
                  <span className="font-mono font-bold">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(soldeDisponible)}</span>
                </div>
              )}
            </section>

            {/* Section 4: Chronogramme */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Chronogramme Prévisionnel</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries({
                  preparation_dao_prevue: 'Préparation DAO',
                  lancement_dao_prevue: 'Lancement DAO',
                  remise_offres_prevue: 'Remise des Offres',
                  ouverture_evaluation_prevue: 'Évaluation',
                  attribution_prevue: 'Attribution',
                  signature_contrat_prevue: 'Signature Contrat',
                  demarrage_prevue: 'Démarrage'
                }).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
                    <input 
                      type="date" 
                      className="input w-full text-sm" 
                      value={dates[key as keyof typeof dates]} 
                      onChange={e => setDates({ ...dates, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </section>
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          {ligne && onDelete ? (
            <button type="button" onClick={handleDelete} disabled={isSubmitting} className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 size={16} /> Supprimer
            </button>
          ) : <div></div>}
          
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" form="ppm-form" disabled={isSubmitting} className="btn btn-primary">
              <Save size={16} />
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
