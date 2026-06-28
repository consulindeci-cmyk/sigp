import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutList, TrendingUp, DollarSign, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useWBS, useUpdateWBSOrder } from '@/hooks/useWBS';
import { useProject } from '@/hooks/useProjects';
import { useUIStore } from '@/stores/uiStore';
import { WBSTree } from '@/components/project/wbs/WBSTree';
import { WBSNodeForm } from '@/components/project/wbs/WBSNodeForm';
import type { WBS } from '@/types';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/forms/Button';

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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background rounded-lg border border-border">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Aucun projet sélectionné</h2>
        <p className="text-muted-foreground">Veuillez sélectionner un projet pour afficher sa structure WBS.</p>
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
    <ContentLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <PageHeader 
          title="Work Breakdown Structure (WBS)"
          subtitle={`Structure hiérarchique des travaux pour le projet ${project?.code_projet || ''}`}
        />
        <Button variant="default" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddRoot}>
          Ajouter Composante
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Éléments WBS</span>
            <LayoutList className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-semibold text-foreground mb-1">{wbsItems.length}</div>
          <div className="text-xs text-muted-foreground">Structure arborescente globale</div>
        </div>
        
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Progression Physique</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div className="text-3xl font-semibold text-foreground mb-2">{Math.round(globalProgress)}%</div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: `${globalProgress}%` }} />
          </div>
        </div>

        <div className="bg-background rounded-lg border border-border p-5 shadow-sm sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Budget Alloué (WBS)</span>
            <DollarSign className="w-4 h-4 text-warning" />
          </div>
          <div className="text-3xl font-semibold text-foreground mb-1">{formatMoney(totalBudget)}</div>
          <div className="text-xs text-muted-foreground">Agrégé depuis les sous-activités</div>
        </div>
      </div>

      <div className="bg-background rounded-lg shadow-sm border border-border flex flex-col h-full overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/10">
          <h3 className="text-base font-semibold text-foreground">Arborescence du Projet</h3>
        </div>
        <div className="p-0 flex-1">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center bg-background">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center bg-background p-8">
              <AlertCircle className="w-10 h-10 text-destructive mb-3" />
              <div className="text-lg font-semibold text-destructive mb-1">Erreur de chargement</div>
              <div className="text-sm text-muted-foreground">Impossible de charger la structure WBS.</div>
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
    </ContentLayout>
  );
}
