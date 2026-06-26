import React, { useState } from 'react';
import type { WBS, StatutWBS } from '@/types';
import { useLogframe } from '@/hooks/useLogframe';

interface WBSNodeFormProps {
  initialData?: Partial<WBS>;
  parentId?: string | null;
  onSubmit: (data: Partial<WBS>) => void;
  onCancel: () => void;
}

export function WBSNodeForm({ initialData, parentId, onSubmit, onCancel }: WBSNodeFormProps) {
  const { data: logframeData } = useLogframe('proj-1'); 
  const logframeItems = logframeData?.data || [];

  const [formData, setFormData] = useState<Partial<WBS>>({
    titre: '',
    statut: 'NON_COMMENCE',
    budget_alloue: 0,
    progression_physique: 0,
    responsable: '',
    logframe_ref_id: '',
    ...initialData
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      parent_id: parentId,
    });
  };

  const isParent = !parentId && !initialData?.parent_id;

  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11, 45, 77, 0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="panel" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', margin: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div className="panel-head">
          <div className="panel-title">
            {initialData?.id ? 'Modifier l\'élément WBS' : (parentId ? 'Nouvelle sous-activité' : 'Nouvelle composante principale')}
          </div>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--slate)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="panel-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-grid">
              <div className="form-field full">
                <label>Titre de l'élément *</label>
                <input 
                  required
                  type="text" 
                  value={formData.titre || ''} 
                  onChange={e => setFormData({...formData, titre: e.target.value})}
                  placeholder="Ex: Construction du bâtiment principal"
                />
              </div>

              <div className="form-field">
                <label>Responsable</label>
                <input 
                  type="text" 
                  value={formData.responsable || ''} 
                  onChange={e => setFormData({...formData, responsable: e.target.value})}
                  placeholder="Nom ou département"
                />
              </div>

              <div className="form-field">
                <label>Statut</label>
                <select 
                  value={formData.statut} 
                  onChange={e => setFormData({...formData, statut: e.target.value as StatutWBS})}
                  className="filter-select"
                  style={{ width: '100%' }}
                >
                  <option value="NON_COMMENCE">Non commencé</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="EN_RETARD">En retard</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>

              <div className="form-field">
                <label>Date de début prévue</label>
                <input 
                  type="date"
                  value={formData.date_debut_prevue || ''} 
                  onChange={e => setFormData({...formData, date_debut_prevue: e.target.value})}
                />
              </div>

              <div className="form-field">
                <label>Date de fin prévue</label>
                <input 
                  type="date"
                  value={formData.date_fin_prevue || ''} 
                  onChange={e => setFormData({...formData, date_fin_prevue: e.target.value})}
                />
              </div>
            </div>

            {!isParent && (
              <div className="form-grid" style={{ marginTop: '4px', paddingTop: '20px', borderTop: '1px solid var(--line-soft)' }}>
                <div className="form-field">
                  <label>Budget alloué (XOF)</label>
                  <input 
                    type="number"
                    value={formData.budget_alloue || ''} 
                    onChange={e => setFormData({...formData, budget_alloue: Number(e.target.value)})}
                  />
                </div>
                
                <div className="form-field">
                  <label>Progression physique (%)</label>
                  <input 
                    type="number" min="0" max="100"
                    value={formData.progression_physique || 0} 
                    onChange={e => setFormData({...formData, progression_physique: Number(e.target.value)})}
                  />
                </div>

                <div className="form-field full">
                  <label>Liaison Cadre Logique (Activité/Produit)</label>
                  <select 
                    value={formData.logframe_ref_id || ''} 
                    onChange={e => setFormData({...formData, logframe_ref_id: e.target.value})}
                    className="filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Aucune liaison --</option>
                    {logframeItems
                      .filter(item => item.niveau_intervention === 'ACTIVITE' || item.niveau_intervention === 'PRODUIT')
                      .map(item => (
                        <option key={item.id} value={item.id}>
                          [{item.niveau_intervention}] {item.indicateur}
                        </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {isParent && (
              <div style={{ marginTop: '4px', paddingTop: '16px', borderTop: '1px solid var(--line-soft)' }}>
                <div className="alert-row" style={{ padding: 0, border: 'none' }}>
                  <div className="alert-ico navy">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  </div>
                  <div>
                    <div className="ar-title">Calcul automatique</div>
                    <div className="ar-meta">Le budget et la progression de cette composante seront calculés automatiquement en fonction de ses sous-activités.</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={onCancel} className="btn">Annuler</button>
              <button type="submit" className="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
