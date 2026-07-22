import { PageHeader } from '@/components/layout/PageHeader';
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText, Download, Plus, Loader2, AlertCircle, Trash2,
  Target, TrendingUp, ListTree, Zap, Activity, LayoutList, FolderInput,
} from 'lucide-react';
import { useLogframe, useCreateLogframe, useUpdateLogframe, useDeleteLogframe } from '@/hooks/useLogframe';
import { useWBS, useUpdateWBSNode } from '@/hooks/useWBS';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { LogframeMatrix } from '@/components/project/logframe/LogframeMatrix';
import { LogframeForm, getNiveauPropose } from '@/components/project/logframe/LogframeForm';
import { LogframeBulkAddModal, type LogframeBulkRow } from '@/components/project/logframe/LogframeBulkAddModal';
import { LogframeImportWbsModal } from '@/components/project/logframe/LogframeImportWbsModal';
import type { CadreLogique } from '@/types';
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-views
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
      <p className="text-xs text-muted-foreground">Impossible de charger le Cadre Logique.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LogframePage
// ─────────────────────────────────────────────────────────────────────────────

export default function LogframePage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId, activeProjectName } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { data: logframeData, isLoading, error } = useLogframe(resolvedProjectId);
  const createMutation = useCreateLogframe(resolvedProjectId);
  const updateMutation = useUpdateLogframe(resolvedProjectId);
  const deleteMutation = useDeleteLogframe(resolvedProjectId);

  // Composantes WBS (nœuds racine) pas encore reliées au Cadre Logique —
  // cf. bouton "Importer les composantes" (WBS.logframe_ref_id === null).
  const { data: wbsData } = useWBS(resolvedProjectId);
  const wbsUpdateMutation = useUpdateWBSNode(resolvedProjectId);
  const unlinkedWbsRoots = useMemo(
    () => (wbsData?.data ?? []).filter(n => !n.parent_id && !n.logframe_ref_id),
    [wbsData?.data],
  );
  const unlinkedWbsCount = unlinkedWbsRoots.length;

  // Miroir des rôles serveur (requireRole) sur logframe-objectives-create/update
  // (COORDINATEUR/CHARGE_PROGRAMME/ADMIN/SUPER_ADMIN) et -delete (ADMIN/SUPER_ADMIN).
  const currentRole = useAuthStore(s => s.user?.role);
  const canManage = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDelete = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  // Pas de miroir d'état local (cf. audit Cadre Logique) : la Matrice et les
  // exports lisent directement la source de vérité, rafraîchie par
  // l'invalidation de logframeKeys.all(projectId) après chaque mutation —
  // même principe que PTBAPage/WBSPage.
  const elements = logframeData?.data ?? [];

  // Form Modal state
  const [isFormOpen,        setIsFormOpen]        = useState(false);
  const [editingItem,       setEditingItem]        = useState<CadreLogique | null>(null);
  const [parentIdForNew,    setParentIdForNew]     = useState<string | null>(null);
  const [parentLevelForNew, setParentLevelForNew]  = useState<string | undefined>(undefined);
  const [formError,         setFormError]          = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<CadreLogique | null>(null);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  // Saisie groupée (Bulk Add) state
  const [isBulkOpen,       setIsBulkOpen]       = useState(false);
  const [bulkParentId,     setBulkParentId]     = useState<string | null>(null);
  const [bulkParentLevel,  setBulkParentLevel]  = useState<string | undefined>(undefined);
  const [bulkError,        setBulkError]        = useState<string | null>(null);
  const [bulkSaving,       setBulkSaving]       = useState(false);

  // Import des composantes WBS non reliées au Cadre Logique
  const [isImportOpen, setIsImportOpen] = useState(false);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => ({
    impacts:   elements.filter(i => i.niveau_intervention === 'IMPACT').length,
    objectifs: elements.filter(i => i.niveau_intervention === 'OBJECTIF').length,
    resultats: elements.filter(i => i.niveau_intervention === 'RESULTAT').length,
    produits:  elements.filter(i => i.niveau_intervention === 'PRODUIT').length,
    activites: elements.filter(i => i.niveau_intervention === 'ACTIVITE').length,
    total:     elements.length,
  }), [elements]);

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!resolvedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Aucun projet sélectionné</h2>
        <p className="text-sm text-muted-foreground">
          Veuillez sélectionner un projet pour afficher son Cadre Logique.
        </p>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEdit = (item: CadreLogique) => {
    setEditingItem(item);
    setParentIdForNew(item.parent_id || null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    const item = elements.find(i => i.id === id) || null;
    setDeleteError(null);
    setDeleteTarget(item);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => setDeleteError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.'),
    });
  };

  const handleAddChild = (parentId: string, parentLevel: string) => {
    setEditingItem(null);
    setParentIdForNew(parentId);
    setParentLevelForNew(parentLevel);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleAddImpact = () => {
    setEditingItem(null);
    setParentIdForNew(null);
    setParentLevelForNew(undefined);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleBulkAddChild = (parentId: string | null, parentLevel?: string) => {
    setBulkParentId(parentId);
    setBulkParentLevel(parentLevel);
    setBulkError(null);
    setIsBulkOpen(true);
  };

  // Séquentiel (comme le wizard de création de projet) : chaque création
  // invalide déjà le cache (cf. useCreateLogframe), donc pas besoin d'un
  // Promise.all — l'échec d'un élément n'annule pas ceux déjà créés.
  const handleBulkSubmit = async (rows: LogframeBulkRow[]) => {
    setBulkError(null);
    setBulkSaving(true);
    const niveau = getNiveauPropose(bulkParentLevel);
    let created = 0;
    try {
      for (const row of rows) {
        await createMutation.mutateAsync({
          niveau_intervention: niveau,
          description: row.description,
          indicateur: row.indicateur,
          parent_id: bulkParentId,
        });
        created++;
      }
      setIsBulkOpen(false);
    } catch (err) {
      setBulkError(
        `${created}/${rows.length} élément(s) créé(s) avant l'échec : ` +
        (err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.'),
      );
    } finally {
      setBulkSaving(false);
    }
  };

  const handleSubmit = (data: Partial<CadreLogique>) => {
    setFormError(null);
    const onError = (err: unknown) => setFormError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
    // Pas de reconstruction locale (cf. audit Cadre Logique) : fermer le
    // modal suffit, l'invalidation de logframeKeys.all(projectId) dans
    // useCreateLogframe/useUpdateLogframe rafraîchit la Matrice depuis la
    // base — même principe que PTBAPage/WBSPage.
    const onSuccess = () => { setIsFormOpen(false); setEditingItem(null); };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data }, { onSuccess, onError });
    } else {
      createMutation.mutate(data, { onSuccess, onError });
    }
  };

  // ── Exports ───────────────────────────────────────────────────────────────

  const getExportName = () => {
    const raw = activeProjectName || '';
    return raw.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'export';
  };

  // 0 est une valeur de baseline légitime — ne jamais tester avec `|| ''`.
  const formatIov = (value: number | null | undefined, unite: string | null | undefined) =>
    value == null ? '' : unite ? `${value} ${unite}` : String(value);

  const exportPDF = () => {
    const projectName = activeProjectName || '';
    const doc = new jsPDF();
    doc.text(`Cadre Logique - ${projectName}`, 14, 15);
    (doc as any).autoTable({
      startY: 20,
      head: [['Niveau', 'Description', 'Indicateur (IOV)', 'Baseline', 'Cible', 'Vérification', 'Hypothèses']],
      body: elements.map(row => [
        row.niveau_intervention,
        row.description,
        row.indicateur || '',
        formatIov(row.valeur_reference, row.unite),
        formatIov(row.cible, row.unite),
        row.source_verification || '',
        row.hypotheses || '',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [10, 22, 40] },
      styles: { fontSize: 8 },
    });
    doc.save(`Cadre_Logique_${getExportName()}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      elements.map(row => ({
        Niveau: row.niveau_intervention,
        Description: row.description,
        'Indicateur (IOV)': row.indicateur || '',
        Baseline: formatIov(row.valeur_reference, row.unite),
        Cible: formatIov(row.cible, row.unite),
        Vérification: row.source_verification || '',
        'Hypothèses/Risques': row.hypotheses || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cadre Logique');
    XLSX.writeFile(wb, `Cadre_Logique_${getExportName()}.xlsx`);
  };

  const impactNode = elements.find(i => i.niveau_intervention === 'IMPACT');
  const hasImpact = !!impactNode;

  const handleImportSubmit = async (nodes: { id: string; libelle: string }[]) => {
    if (!impactNode) return;
    setBulkError(null);
    setBulkSaving(true);
    let created = 0;
    try {
      for (const node of nodes) {
        const objective = await createMutation.mutateAsync({
          niveau_intervention: 'RESULTAT',
          description: node.libelle,
          parent_id: impactNode.id,
        });
        await wbsUpdateMutation.mutateAsync({ id: node.id, data: { logframe_ref_id: objective.id } });
        created++;
      }
      setIsImportOpen(false);
    } catch (err) {
      setBulkError(
        `${created}/${nodes.length} composante(s) importée(s) avant l'échec : ` +
        (err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.'),
      );
    } finally {
      setBulkSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div>
          <PageHeader title="Cadre Logique" description="
            Matrice de planification et de suivi des indicateurs objectivement vérifiables
          " />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileText className="h-3.5 w-3.5" />}
            onClick={exportPDF}
            className="h-8 text-xs"
          >
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={exportExcel}
            className="h-8 text-xs"
          >
            Excel
          </Button>
          {hasImpact && canManage && unlinkedWbsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FolderInput className="h-3.5 w-3.5" />}
              onClick={() => setIsImportOpen(true)}
              className="h-8 text-xs"
            >
              Importer les composantes ({unlinkedWbsCount})
            </Button>
          )}
          {!hasImpact && canManage && (
            <Button
              variant="default"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={handleAddImpact}
              className="h-8 text-xs"
            >
              Définir l'Impact
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-4 py-3 border-b border-border bg-muted/10">
        <StatCard
          title="Impact"
          value={kpis.impacts}
          icon={<Zap className="h-4 w-4" />}
          iconVariant="info"
          description="Niveau stratégique"
        />
        <StatCard
          title="Objectifs"
          value={kpis.objectifs}
          icon={<Target className="h-4 w-4" />}
          iconVariant="primary"
          description="Effets attendus"
        />
        <StatCard
          title="Résultats"
          value={kpis.resultats}
          icon={<TrendingUp className="h-4 w-4" />}
          iconVariant="warning"
          description="Réalisations intermédiaires"
        />
        <StatCard
          title="Produits"
          value={kpis.produits}
          icon={<ListTree className="h-4 w-4" />}
          iconVariant="success"
          description="Livrables tangibles"
        />
        <StatCard
          title="Activités"
          value={kpis.activites}
          icon={<Activity className="h-4 w-4" />}
          iconVariant="default"
          description="Actions opérationnelles"
        />
        <StatCard
          title="Total éléments"
          value={kpis.total}
          icon={<LayoutList className="h-4 w-4" />}
          iconVariant="default"
          description="Matrice complète"
        />
      </div>

      {/* ── MATRICE ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="shrink-0 px-4 py-2.5 border-b border-border bg-muted/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Matrice de Suivi</h2>
          <span className="text-xs text-muted-foreground">
            {kpis.total} élément{kpis.total !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <LoadingView />
          ) : error ? (
            <ErrorView />
          ) : (
            <LogframeMatrix
              data={elements}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onAddChild={handleAddChild}
              onBulkAddChild={handleBulkAddChild}
              canManage={canManage}
              canDelete={canDelete}
            />
          )}
        </div>
      </div>

      {/* ── FORMULAIRE (Modal) ─────────────────────────────────────────────── */}
      <LogframeForm
        open={isFormOpen}
        onOpenChange={open => {
          setIsFormOpen(open);
          if (!open) { setEditingItem(null); setFormError(null); }
        }}
        initialData={editingItem || undefined}
        parentId={parentIdForNew}
        parentLevel={parentLevelForNew}
        onSubmit={handleSubmit}
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />

      {/* ── SAISIE GROUPÉE (Modal) ──────────────────────────────────────────── */}
      <LogframeBulkAddModal
        open={isBulkOpen}
        onOpenChange={open => {
          setIsBulkOpen(open);
          if (!open) setBulkError(null);
        }}
        parentId={bulkParentId}
        parentLevel={bulkParentLevel}
        onSubmit={handleBulkSubmit}
        isSaving={bulkSaving}
        error={bulkError}
      />

      {/* ── IMPORT DES COMPOSANTES WBS (Modal) ──────────────────────────────── */}
      <LogframeImportWbsModal
        open={isImportOpen}
        onOpenChange={open => {
          setIsImportOpen(open);
          if (!open) setBulkError(null);
        }}
        candidates={unlinkedWbsRoots}
        onSubmit={handleImportSubmit}
        isSaving={bulkSaving}
        error={bulkError}
      />

      {/* ── MODAL DE CONFIRMATION DE SUPPRESSION ───────────────────────────── */}
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
              &ldquo;{deleteTarget?.description}&rdquo;
            </span>{' '}
            et tous ses éléments subordonnés ?
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
