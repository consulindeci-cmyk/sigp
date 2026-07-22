import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  LayoutList, TrendingUp, Banknote, Plus, Loader2,
  AlertCircle, Network, Layers, Trash2,
} from 'lucide-react';
import { useWBS, useUpdateWBSOrder, useCreateWBSNode, useUpdateWBSNode, useDeleteWBSNode } from '@/hooks/useWBS';
import { useOrganisationMembersForPicker } from '@/hooks/useGovernance';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
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
    <div className="flex min-h-[300px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ErrorView() {
  return (
    <div className="flex flex-col min-h-[300px] items-center justify-center gap-2">
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
  const createMutation  = useCreateWBSNode(resolvedProjectId);
  const updateMutation  = useUpdateWBSNode(resolvedProjectId);
  const deleteMutation  = useDeleteWBSNode(resolvedProjectId);

  // Miroir des rôles serveur (requireRole) sur wbs-create/update/reorder
  // (COORDINATEUR/CHARGE_PROGRAMME/ADMIN/SUPER_ADMIN) et wbs-delete (ADMIN/SUPER_ADMIN).
  const currentRole = useAuthStore(s => s.user?.role);
  const canManage = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDelete = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  const [wbsItems, setWbsItems] = useState<WBS[]>([]);

  useEffect(() => {
    if (wbsData?.data) setWbsItems(wbsData.data);
  }, [wbsData?.data]);

  // Résolution de l'UUID responsable (aucune jointure côté hook) en nom
  // affichable — cf. même correctif déjà appliqué au module PTBA.
  const { data: orgMembers = [] } = useOrganisationMembersForPicker(resolvedProjectId);
  const responsableLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of orgMembers) map[m.id] = m.displayName;
    return map;
  }, [orgMembers]);

  // Form SlideOver state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<WBS | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<WBS | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Bannière d'erreur globale (réordonnancement — pas de modal/panel associé)
  const [reorderError, setReorderError] = useState<string | null>(null);

  const extractErrorMessage = (err: unknown): string =>
    err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleReorder = (newItems: WBS[]) => {
    const previousItems = wbsItems;
    setReorderError(null);
    setWbsItems(newItems);
    reorderMutation.mutate(
      newItems.map((item, index) => ({ id: item.id, parent_id: item.parent_id, ordre: index + 1 })),
      {
        onError: (err) => {
          setWbsItems(previousItems);
          setReorderError(extractErrorMessage(err));
        },
      }
    );
  };

  const handleEdit = (node: WBS) => {
    setEditingNode(node);
    setParentIdForNew(node.parent_id || null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    const node = wbsItems.find(i => i.id === id) || null;
    setDeleteError(null);
    setDeleteTarget(node);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setWbsItems(prev =>
          prev.filter(item => item.id !== deleteTarget.id && item.parent_id !== deleteTarget.id)
        );
        setDeleteTarget(null);
      },
      onError: (err) => setDeleteError(extractErrorMessage(err)),
    });
  };

  const handleAddChild = (parentId: string) => {
    setEditingNode(null);
    setParentIdForNew(parentId);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleAddRoot = () => {
    setEditingNode(null);
    setParentIdForNew(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: Partial<WBS>) => {
    setFormError(null);
    const onError = (err: unknown) => setFormError(extractErrorMessage(err));
    const newNode: WBS = {
      id: editingNode?.id || `wbs-new-${Date.now()}`,
      projet_id: resolvedProjectId,
      code_wbs: editingNode?.code_wbs || data.code_wbs || '',
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
      updateMutation.mutate(
        { id: editingNode.id, data },
        {
          onSuccess: () => {
            setWbsItems(prev => prev.map(item => (item.id === editingNode.id ? newNode : item)));
            setIsFormOpen(false);
          },
          onError,
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            setWbsItems(prev => [...prev, newNode]);
            setIsFormOpen(false);
          },
          onError,
        }
      );
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
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Aucun projet sélectionné</h2>
        <p className="text-sm text-muted-foreground">
          Veuillez sélectionner un projet pour afficher sa structure WBS.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Work Breakdown Structure</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Structure hiérarchique des travaux et des composantes du projet
          </p>
        </div>
        {canManage && (
          <Button
            variant="default"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={handleAddRoot}
            className="h-8 text-xs"
          >
            Ajouter composante
          </Button>
        )}
      </div>

      {reorderError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{reorderError}</span>
        </div>
      )}

      {/* ── KPI STRIP ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
          icon={<Banknote className="h-4 w-4 text-warning" />}
          iconVariant="warning"
          description="Agrégé depuis racines"
        />
      </div>

      {/* ── TREE ────────────────────────────────────────────────────────────── */}
      <div className="border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="shrink-0 px-4 py-2.5 border-b border-border bg-muted/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Arborescence du Projet</h3>
          <span className="text-xs text-muted-foreground">{wbsItems.length} élément{wbsItems.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
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
              canManage={canManage}
              canDelete={canDelete}
              responsableLabels={responsableLabels}
            />
          )}
        </div>
      </div>

      {/* ── SLIDEOVER (Formulaire) ───────────────────────────────────────────── */}
      <WBSNodeForm
        open={isFormOpen}
        onOpenChange={open => {
          setIsFormOpen(open);
          if (!open) { setEditingNode(null); setFormError(null); }
        }}
        initialData={editingNode || undefined}
        parentId={parentIdForNew}
        projectId={resolvedProjectId}
        existingNodes={wbsItems}
        onSubmit={handleFormSubmit}
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />

      {/* ── MODAL DE CONFIRMATION DE SUPPRESSION ──────────────────────────── */}
      <Modal open={!!deleteTarget} onOpenChange={open => { if (!open) { setDeleteTarget(null); setDeleteError(null); } }}>
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
          {deleteError && (
            <p className="px-6 pb-2 text-sm text-destructive flex items-center gap-1.5" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {deleteError}
            </p>
          )}
          <ModalFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteError(null); }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
}
