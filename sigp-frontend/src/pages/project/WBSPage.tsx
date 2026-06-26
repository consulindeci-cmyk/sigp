import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutList, TrendingUp, DollarSign } from 'lucide-react';
import { useWBS, useUpdateWBSOrder } from '@/hooks/useWBS';
import { useProject } from '@/hooks/useProjects';
import { useUIStore } from '@/stores/uiStore';
import { WBSTree } from '@/components/project/wbs/WBSTree';
import { WBSNodeForm } from '@/components/project/wbs/WBSNodeForm';
import type { WBS } from '@/types';

export default function WBSPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { data: project } = useProject(resolvedProjectId);
  const { data: wbsData, isLoading, error } = useWBS(resolvedProjectId);
  const reorderMutation = useUpdateWBSOrder(resolvedProjectId);

  const [wbsItems, setWbsItems] = useState<WBS[]>([]);
  
  React.useEffect(() => {
    if (wbsData?.data) {
      setWbsItems(wbsData.data);
    }
  }, [wbsData]);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<WBS | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);

  if (!resolvedProjectId) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <div className="es-title">Aucun projet sélectionné</div>
        <div className="es-sub">Veuillez sélectionner un projet pour afficher sa structure WBS.</div>
      </div>
    );
  }

  const handleReorder = (newItems: WBS[]) => {
    setWbsItems(newItems);
    const itemsToUpdate = newItems.map((item, index) => ({
      id: item.id,
      parent_id: item.parent_id,
      ordre: index + 1
    }));
    reorderMutation.mutate(itemsToUpdate);
  };

  const handleEdit = (node: WBS) => {
    setEditingNode(node);
    setParentIdForNew(node.parent_id || null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément et tous ses sous-éléments ?')) {
      setWbsItems(prev => prev.filter(item => item.id !== id && item.parent_id !== id));
      // delete mutation
    }
  };

  const handleAddChild = (parentId: string) => {
    setEditingNode(null);
    setParentIdForNew(parentId);
    setIsFormOpen(true);
  };

  const handleAddRoot = () => {
    setEditingNode(null);
    setParentIdForNew(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: Partial<WBS>) => {
    const newNode: WBS = {
      id: editingNode?.id || `wbs-new-${Date.now()}`,
      projet_id: resolvedProjectId,
      code_wbs: editingNode?.code_wbs || (data.parent_id ? '?.?' : `${wbsItems.filter(i => !i.parent_id).length + 1}`),
      titre: data.titre || '',
      niveau: data.parent_id ? (wbsItems.find(i => i.id === data.parent_id)?.niveau || 0) + 1 : 1,
      ordre: editingNode?.ordre || wbsItems.length + 1,
      parent_id: data.parent_id || null,
      statut: data.statut || 'NON_COMMENCE',
      responsable: data.responsable || '',
      date_debut_prevue: data.date_debut_prevue,
      date_fin_prevue: data.date_fin_prevue,
      budget_alloue: data.budget_alloue || 0,
      progression_physique: data.progression_physique || 0,
      logframe_ref_id: data.logframe_ref_id,
    };

    if (editingNode) {
      setWbsItems(prev => prev.map(item => item.id === editingNode.id ? newNode : item));
    } else {
      setWbsItems(prev => [...prev, newNode]);
    }
    
    setIsFormOpen(false);
  };

  const totalBudget = wbsItems.filter(i => !i.parent_id).reduce((sum, item) => sum + (item.budget_alloue || 0), 0);
  const globalProgress = wbsItems.filter(i => !i.parent_id).length > 0 
    ? wbsItems.filter(i => !i.parent_id).reduce((sum, item) => sum + (item.progression_physique || 0), 0) / wbsItems.filter(i => !i.parent_id).length
    : 0;
  
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      
      <div className="page-head" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Work Breakdown Structure (WBS)</h1>
          <p className="page-sub">Structure hiérarchique des travaux pour le projet {project?.code_projet}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleAddRoot}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Ajouter Composante
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Éléments WBS</span>
            <div className="kpi-icon navy">
              <LayoutList size={16} />
            </div>
          </div>
          <div className="kpi-value">{wbsItems.length}</div>
          <div className="kpi-foot">
            <span>Structure arborescente globale</span>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Progression Physique</span>
            <div className="kpi-icon green">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">{Math.round(globalProgress)}%</div>
          <div className="kpi-foot">
            <div className="progress-track" style={{ flex: 1, marginTop: '2px' }}>
              <div className="progress-fill green" style={{ width: `${globalProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="kpi-card" style={{ gridColumn: 'span 2' }}>
          <div className="kpi-top">
            <span className="kpi-label">Budget Alloué (WBS)</span>
            <div className="kpi-icon amber">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="kpi-value">{formatMoney(totalBudget)}</div>
          <div className="kpi-foot">
            <span>Agrégé depuis les sous-activités</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">Arborescence du Projet</div>
        </div>
        <div className="panel-body tight">
          {isLoading ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>
              <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--line-soft)', borderTopColor: 'var(--navy-900)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <div className="es-title" style={{ color: 'var(--red)' }}>Erreur de chargement</div>
              <div className="es-sub">Impossible de charger la structure WBS.</div>
            </div>
          ) : (
            <WBSTree 
              data={wbsItems}
              onReorder={handleReorder}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
            />
          )}
        </div>
      </div>

      {isFormOpen && (
        <WBSNodeForm 
          initialData={editingNode || undefined}
          parentId={parentIdForNew}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
