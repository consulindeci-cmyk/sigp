import { PageHeader } from '@/components/layout/PageHeader';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  LayoutList, TrendingUp, DollarSign, Plus, Loader2,
  AlertCircle, Network, Layers, Trash2,
} from 'lucide-react';
import { useWBS, useUpdateWBSOrder } from '@/hooks/useWBS';
import { useUIStore } from '@/stores/uiStore';
import { WBSTree } from '@/components/project/wbs/WBSTree';
import { WBSNodeForm } from '@/components/project/wbs/WBSNodeForm';
import type { WBS } from '@/types';
import { Button } from '@/components/ui/forms/Button';
import { StatCard } from '@/components/ui/data-display/StatCard';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/overlays/Modal';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatMoney = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(n);

// ─────────────────────────────────────────────────────────────────────────────
// Loading / Error views
// ─────────────────────────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ErrorView() {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-2">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm font-medium text-destructive">Erreur de chargement</p>
      <p className="text-xs text-muted-foreground">Impossible de charger la structure WBS.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WBSPage
// ─────────────────────────────────────────────────────────────────────────────

export default function WBSPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { data: wbsData, isLoading, error } = useWBS(resolvedProjectId);
  const reorderMutation = useUpdateWBSOrder(resolvedProjectId);

  const [wbsItems, setWbsItems] = useState<WBS[]>([]);

  useEffect(() => {
    if (wbsData?.data) setWbsItems(wbsData.data);
  }, [wbsData?.data]);

  // Form SlideOver state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<WBS | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<WBS | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleReorder = (newItems: WBS[]) => {
    setWbsItems(newItems);
    reorderMutation.mutate(
      newItems.map((item, index) => ({ id: item.id, parent_id: item.parent_id, ordre: index + 1 }))
    );
  };

  const handleEdit = (node: WBS) => {
    setEditingNode(node);
    setParentIdForNew(node.parent_id || null);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    const node = wbsItems.find(i => i.id === id) || null;
    setDeleteTarget(node);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setWbsItems(prev =>
      prev.filter(item => item.id !== deleteTarget.id && item.parent_id !== deleteTarget.id)
    );
    setDeleteTarget(null);
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

  const handleFormSubmit = (data: Partial<WBS>) => {
    const newNode: WBS = {
      id: editingNode?.id || `wbs-new-${Date.now()}`,
      projet_id: resolvedProjectId,
      code_wbs:
        editingNode?.code_wbs ||
        (data.parent_id
          ? '?.?'
          : `${wbsItems.filter(i => !i.parent_id).length + 1}`),
      titre: data.titre || '',
      niveau: data.parent_id
        ? (wbsItems.find(i => i.id === data.parent_id)?.niveau || 0) + 1
        : 1,
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
      setWbsItems(prev => prev.map(item => (item.id === editingNode.id ? newNode : item)));
    } else {
      setWbsItems(prev => [...prev, newNode]);
    }
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const composantes = wbsItems.filter(i => !i.parent_id).length;
    const sousElements = wbsItems.filter(i => !!i.parent_id).length;
    const activites = wbsItems.filter(i => !wbsItems.some(j => j.parent_id === i.id)).length;
    const niveauMax = wbsItems.length > 0 ? Math.max(...wbsItems.map(i => i.niveau || 1)) : 0;
    const budgetTotal = wbsItems
      .filter(i => !i.parent_id)
      .reduce((sum, i) => sum + (i.budget_alloue || 0), 0);
    const progressionMoyenne =
      wbsItems.length > 0
        ? Math.round(
            wbsItems.reduce((sum, i) => sum + (i.progression_physique || 0), 0) / wbsItems.length
          )
        : 0;

    return { composantes, sousElements, activites, niveauMax, budgetTotal, progressionMoyenne };
  }, [wbsItems]);

  // ── No project guard ──────────────────────────────────────────────────────

  if (!resolvedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Aucun projet sélectionné</h2>
        <p className="text-sm text-muted-foreground">
          Veuillez sélectionner un projet pour afficher sa structure WBS.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div>
          <PageHeader title="Work Breakdown Structure" description="
            Structure hiérarchique des travaux et des composantes du projet
          " />
        </div>
        <Button
          variant="default"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={handleAddRoot}
          className="h-8 text-xs"
        >
          Ajouter composante
        </Button>
      </div>

      {/* ── KPI STRIP ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-4 py-3 border-b border-border bg-muted/10">
        <StatCard
          title="Composantes"
          value={kpis.composantes}
          icon={<Network className="h-4 w-4 text-primary" />}
          iconVariant="primary"
          description="Niveau 1 (racine)"
        />
        <StatCard
          title="Sous-éléments"
          value={kpis.sousElements}
          icon={<Layers className="h-4 w-4 text-info" />}
          iconVariant="info"
          description="Niveaux 2+"
        />
        <StatCard
          title="Activités"
          value={kpis.activites}
          icon={<LayoutList className="h-4 w-4 text-warning" />}
          iconVariant="warning"
          description="Éléments terminaux"
        />
        <StatCard
          title="Niveau max"
          value={kpis.niveauMax}
          icon={<Layers className="h-4 w-4 text-secondary-foreground" />}
          iconVariant="default"
          description="Profondeur arbre"
        />
        <StatCard
          title="Progression"
          value={`${kpis.progressionMoyenne}%`}
          icon={<TrendingUp className="h-4 w-4 text-success" />}
          iconVariant="success"
          description="Moyenne globale"
        />
        <StatCard
          title="Budget alloué"
          value={formatMoney(kpis.budgetTotal)}
          icon={<DollarSign className="h-4 w-4 text-warning" />}
          iconVariant="warning"
          description="Agrégé depuis racines"
        />
      </div>

      {/* ── TREE ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="shrink-0 px-4 py-2.5 border-b border-border bg-muted/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Arborescence du Projet</h2>
          <span className="text-xs text-muted-foreground">{wbsItems.length} élément{wbsItems.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <LoadingView />
          ) : error ? (
            <ErrorView />
          ) : (
            <WBSTree
              data={wbsItems}
              onReorder={handleReorder}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onAddChild={handleAddChild}
            />
          )}
        </div>
      </div>

      {/* ── SLIDEOVER (Formulaire) ───────────────────────────────────────────── */}
      <WBSNodeForm
        open={isFormOpen}
        onOpenChange={open => {
          setIsFormOpen(open);
          if (!open) setEditingNode(null);
        }}
        initialData={editingNode || undefined}
        parentId={parentIdForNew}
        onSubmit={handleFormSubmit}
      />

      {/* ── MODAL DE CONFIRMATION DE SUPPRESSION ──────────────────────────── */}
      <Modal open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <ModalTitle>Confirmer la suppression</ModalTitle>
                <ModalDescription className="mt-0.5">
                  Cette action est irréversible.
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>
          <p className="text-sm text-muted-foreground px-6 pb-2">
            Voulez-vous supprimer{' '}
            <span className="font-semibold text-foreground">
              &ldquo;{deleteTarget?.titre}&rdquo;
            </span>{' '}
            et tous ses sous-éléments ?
          </p>
          <ModalFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
}
