import React, { useState } from 'react';
import type { WBS, StatutWBS } from '@/types';
import { useLogframe } from '@/hooks/useLogframe';
import { Button } from '@/components/ui/forms/Button';
import { X, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-lg border border-border w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <h2 className="text-lg font-bold text-foreground">
            {initialData?.id ? 'Modifier l\'élément WBS' : (parentId ? 'Nouvelle sous-activité' : 'Nouvelle composante principale')}
          </h2>
          <button 
            type="button"
            onClick={onCancel} 
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form id="wbs-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Titre de l'élément *</label>
                <input 
                  required
                  type="text" 
                  value={formData.titre || ''} 
                  onChange={e => setFormData({...formData, titre: e.target.value})}
                  placeholder="Ex: Construction du bâtiment principal"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Responsable</label>
                <input 
                  type="text" 
                  value={formData.responsable || ''} 
                  onChange={e => setFormData({...formData, responsable: e.target.value})}
                  placeholder="Nom ou département"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Statut</label>
                <select 
                  value={formData.statut} 
                  onChange={e => setFormData({...formData, statut: e.target.value as StatutWBS})}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="NON_COMMENCE">Non commencé</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="EN_RETARD">En retard</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Date de début prévue</label>
                <input 
                  type="date"
                  value={formData.date_debut_prevue || ''} 
                  onChange={e => setFormData({...formData, date_debut_prevue: e.target.value})}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Date de fin prévue</label>
                <input 
                  type="date"
                  value={formData.date_fin_prevue || ''} 
                  onChange={e => setFormData({...formData, date_fin_prevue: e.target.value})}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {!isParent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 border-t border-border">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">Budget alloué (XOF)</label>
                  <input 
                    type="number"
                    value={formData.budget_alloue || ''} 
                    onChange={e => setFormData({...formData, budget_alloue: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">Progression physique (%)</label>
                  <input 
                    type="number" min="0" max="100"
                    value={formData.progression_physique || 0} 
                    onChange={e => setFormData({...formData, progression_physique: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-foreground">Liaison Cadre Logique (Activité/Produit)</label>
                  <select 
                    value={formData.logframe_ref_id || ''} 
                    onChange={e => setFormData({...formData, logframe_ref_id: e.target.value})}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
              <div className="pt-5 border-t border-border">
                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-foreground">Calcul automatique</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Le budget et la progression de cette composante seront calculés automatiquement en fonction de ses sous-activités.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30 shrink-0">
          <Button variant="outline" onClick={onCancel} type="button">
            Annuler
          </Button>
          <Button variant="default" type="submit" form="wbs-form">
            Enregistrer
          </Button>
        </div>

      </div>
    </div>
  );
}
