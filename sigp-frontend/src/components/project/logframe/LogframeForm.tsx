import React, { useState } from 'react';
import type { CadreLogique } from '@/types';

interface LogframeFormProps {
  initialData?: Partial<CadreLogique>;
  parentId?: string | null;
  parentLevel?: string;
  onSubmit: (data: Partial<CadreLogique>) => void;
  onCancel: () => void;
}

const NIVEAUX_HIERARCHIE = ['IMPACT', 'OBJECTIF', 'RESULTAT', 'PRODUIT', 'ACTIVITE'];

export function LogframeForm({ initialData, parentId, parentLevel, onSubmit, onCancel }: LogframeFormProps) {
  
  let niveauPropose = 'IMPACT';
  if (parentLevel) {
    const parentIndex = NIVEAUX_HIERARCHIE.indexOf(parentLevel);
    if (parentIndex >= 0 && parentIndex < NIVEAUX_HIERARCHIE.length - 1) {
      niveauPropose = NIVEAUX_HIERARCHIE[parentIndex + 1];
    }
  }

  const [formData, setFormData] = useState<Partial<CadreLogique>>({
    niveau_intervention: initialData?.niveau_intervention || (niveauPropose as any),
    indicateur: '',
    valeur_reference: '',
    cible: '',
    source_verification: '',
    hypotheses: '',
    ...initialData
  });

  const isActivite = formData.niveau_intervention === 'ACTIVITE';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      parent_id: parentId,
    });
  };

  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11, 45, 77, 0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="panel" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '700px', margin: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div className="panel-head">
          <div className="panel-title">
            {initialData?.id ? 'Modifier l\'élément' : 'Nouvel élément du Cadre Logique'}
          </div>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--slate)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="panel-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-grid">
              
              <div className="form-field full">
                <label>Niveau d'intervention *</label>
                <select 
                  required
                  disabled={!!parentId}
                  value={formData.niveau_intervention} 
                  onChange={e => setFormData({...formData, niveau_intervention: e.target.value as any})}
                  className="filter-select"
                  style={{ width: '100%', backgroundColor: parentId ? 'var(--canvas)' : '#fff' }}
                >
                  {NIVEAUX_HIERARCHIE.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                {parentId && (
                  <div style={{ fontSize: '11px', color: 'var(--navy-500)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                     Niveau défini automatiquement par rapport à l'élément parent.
                  </div>
                )}
              </div>
              
              <div className="form-field full">
                <label>Description / Indicateur (IOV) *</label>
                <textarea 
                  required rows={3}
                  value={formData.indicateur || ''} 
                  onChange={e => setFormData({...formData, indicateur: e.target.value})}
                  placeholder={isActivite ? "Description de l'activité..." : "Objectif objectivement vérifiable..."}
                />
              </div>

              {!isActivite && (
                <>
                  <div className="form-field">
                    <label>Baseline (Référence)</label>
                    <input 
                      type="text"
                      value={formData.valeur_reference || ''} 
                      onChange={e => setFormData({...formData, valeur_reference: e.target.value})}
                    />
                  </div>

                  <div className="form-field">
                    <label>Cible</label>
                    <input 
                      type="text"
                      value={formData.cible || ''} 
                      onChange={e => setFormData({...formData, cible: e.target.value})}
                    />
                  </div>

                  <div className="form-field full">
                    <label>Source de Vérification</label>
                    <input 
                      type="text"
                      value={formData.source_verification || ''} 
                      onChange={e => setFormData({...formData, source_verification: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="form-field full">
                <label>Hypothèses / risques</label>
                <input 
                  type="text"
                  value={formData.hypotheses || ''} 
                  onChange={e => setFormData({...formData, hypotheses: e.target.value})}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--line-soft)' }}>
              <button type="button" onClick={onCancel} className="btn">Annuler</button>
              <button type="submit" className="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
