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
      <div 
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)', zIndex: 1000, transition: 'opacity 0.3s'
        }} 
        onClick={onClose} 
      />
      
      <div 
        style={{
          position: 'fixed', top: 0, bottom: 0, right: 0, width: '600px',
          backgroundColor: 'white', boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1), -8px 0 10px -6px rgba(0, 0, 0, 0.1)',
          zIndex: 1050, display: 'flex', flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--line-soft)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)' }}>
            {ligne ? 'Modifier la ligne de marché' : 'Nouvelle ligne de marché'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--slate)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {error && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--red-bg, #fef2f2)', border: '1px solid var(--red-border, #fecaca)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px', color: 'var(--red-text, #b91c1c)' }}>
              <AlertCircle size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{error}</div>
            </div>
          )}

          <form id="ppm-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Section 1: Identification */}
            <section>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--line-soft)' }}>Identification</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>Référence du marché *</label>
                  <input required type="text" className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={reference} onChange={e => setReference(e.target.value)} placeholder="Ex: AOI-001/2026" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>WBS *</label>
                  <input required type="text" className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={wbsId} onChange={e => setWbsId(e.target.value)} placeholder="wbs-1-1" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>Description *</label>
                  <textarea required className="input" style={{ width: '100%', minHeight: '80px', boxSizing: 'border-box' }} value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>Ligne Budgétaire (Source) *</label>
                  <select required className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={budgetLigneId} onChange={e => setBudgetLigneId(e.target.value)}>
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
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--line-soft)' }}>Configuration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>Catégorie *</label>
                  <select required className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={categorie} onChange={e => setCategorie(e.target.value as any)}>
                    <option value="TRAVAUX">Travaux</option>
                    <option value="BIENS">Biens</option>
                    <option value="SERVICES_CONSULTANTS">Services Consultants</option>
                    <option value="SERVICES_NON_CONSULTANTS">Services Non Consultants</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>Méthode *</label>
                  <select required className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={methode} onChange={e => setMethode(e.target.value as any)}>
                    <option value="AOI">AOI</option>
                    <option value="AON">AON</option>
                    <option value="QCBS">QCBS</option>
                    <option value="CF">CF</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>Revue *</label>
                  <select required className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={typeRevue} onChange={e => setTypeRevue(e.target.value as any)}>
                    <option value="PRIOR">A Priori (PRIOR)</option>
                    <option value="POST">A Posteriori (POST)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>Bailleur *</label>
                  <select required className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={bailleurId} onChange={e => setBailleurId(e.target.value)}>
                    <option value="">-- Sélectionner --</option>
                    <option value="b-ida">IDA (Banque Mondiale)</option>
                    <option value="b-afd">AFD</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section 3: Finances */}
            <section>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--line-soft)' }}>Données Financières</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>Devise *</label>
                  <select required className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={deviseCode} onChange={e => setDeviseCode(e.target.value)}>
                    <option value="XOF">XOF</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>Taux de change (vers XOF) *</label>
                  <input required type="number" min="1" step="0.01" className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={tauxChange} onChange={e => setTauxChange(Number(e.target.value))} disabled={deviseCode === 'XOF'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>Montant Estimé (Devise) *</label>
                  <input required type="number" min="0" className="input" style={{ width: '100%', boxSizing: 'border-box' }} value={montantDevise} onChange={e => setMontantDevise(Number(e.target.value))} />
                </div>
                <div style={{ backgroundColor: 'var(--canvas)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line-soft)' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>Montant Base (XOF)</label>
                  <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)' }}>
                    {new Intl.NumberFormat('fr-FR').format(montantBase)}
                  </div>
                </div>
              </div>
              
              {/* Feedback Budgétaire UI */}
              {soldeDisponible !== null && (
                <div style={{ 
                  marginTop: '16px', padding: '12px', borderRadius: '6px', fontSize: '14px', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  ...(montantBase > soldeDisponible 
                    ? { backgroundColor: 'var(--red-bg, #fef2f2)', borderColor: 'var(--red-border, #fecaca)', color: 'var(--red-text, #b91c1c)' }
                    : { backgroundColor: 'var(--green-bg, #f0fdf4)', borderColor: 'var(--green-border, #bbf7d0)', color: 'var(--green-text, #15803d)' })
                }}>
                  <span style={{ fontWeight: 500 }}>Solde Budgétaire Ligne ({budgetLigneId}) :</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(soldeDisponible)}</span>
                </div>
              )}
            </section>

            {/* Section 4: Chronogramme */}
            <section>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--line-soft)' }}>Chronogramme Prévisionnel</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--slate)', marginBottom: '4px' }}>{label}</label>
                    <input 
                      type="date" 
                      className="input" 
                      style={{ width: '100%', fontSize: '14px', boxSizing: 'border-box' }} 
                      value={dates[key as keyof typeof dates]} 
                      onChange={e => setDates({ ...dates, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </section>
          </form>
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid var(--line-soft)', backgroundColor: 'var(--canvas)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {ligne && onDelete ? (
            <button type="button" onClick={handleDelete} disabled={isSubmitting} className="btn" style={{ backgroundColor: 'var(--red-bg, #fef2f2)', color: 'var(--red, #ef4444)', border: '1px solid var(--red-border, #fecaca)' }}>
              <Trash2 size={16} style={{ marginRight: '8px' }} /> Supprimer
            </button>
          ) : <div></div>}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" form="ppm-form" disabled={isSubmitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} />
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
