import { PageHeader } from '@/components/layout/PageHeader';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText, Download, Plus, Loader2, AlertCircle, Trash2,
  Target, TrendingUp, ListTree, Zap, Activity, LayoutList,
} from 'lucide-react';
import { useLogframe, useCreateLogframe, useUpdateLogframe, useDeleteLogframe } from '@/hooks/useLogframe';
import { useUIStore } from '@/stores/uiStore';
import { LogframeMatrix } from '@/components/project/logframe/LogframeMatrix';
import { LogframeForm } from '@/components/project/logframe/LogframeForm';
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

  const elements = logframeData?.data ?? [];
  const [localData, setLocalData] = useState<CadreLogique[]>([]);

  useEffect(() => {
    if (elements.length > 0) setLocalData(elements);
  }, [elements]);

  // Form SlideOver state
  const [isFormOpen,        setIsFormOpen]        = useState(false);
  const [editingItem,       setEditingItem]        = useState<CadreLogique | null>(null);
  const [parentIdForNew,    setParentIdForNew]     = useState<string | null>(null);
  const [parentLevelForNew, setParentLevelForNew]  = useState<string | undefined>(undefined);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<CadreLogique | null>(null);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => ({
    impacts:   localData.filter(i => i.niveau_intervention === 'IMPACT').length,
    objectifs: localData.filter(i => i.niveau_intervention === 'OBJECTIF').length,
    resultats: localData.filter(i => i.niveau_intervention === 'RESULTAT').length,
    produits:  localData.filter(i => i.niveau_intervention === 'PRODUIT').length,
    activites: localData.filter(i => i.niveau_intervention === 'ACTIVITE').length,
    total:     localData.length,
  }), [localData]);

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
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    const item = localData.find(i => i.id === id) || null;
    setDeleteTarget(item);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setLocalData(prev =>
      prev.filter(i => i.id !== deleteTarget.id && i.parent_id !== deleteTarget.id)
    );
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleAddChild = (parentId: string, parentLevel: string) => {
    setEditingItem(null);
    setParentIdForNew(parentId);
    setParentLevelForNew(parentLevel);
    setIsFormOpen(true);
  };

  const handleAddImpact = () => {
    setEditingItem(null);
    setParentIdForNew(null);
    setParentLevelForNew(undefined);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: Partial<CadreLogique>) => {
    if (editingItem) {
      const updated = { ...editingItem, ...data };
      setLocalData(prev => prev.map(i => (i.id === editingItem.id ? updated : i)));
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      const newItem: CadreLogique = {
        id: `lf-new-${Date.now()}`,
        projet_id: resolvedProjectId,
        parent_id: data.parent_id || null,
        niveau_intervention: data.niveau_intervention as CadreLogique['niveau_intervention'],
        indicateur: data.indicateur || '',
        valeur_reference: data.valeur_reference,
        cible: data.cible,
        source_verification: data.source_verification,
        hypotheses: data.hypotheses,
      };
      setLocalData(prev => [...prev, newItem]);
      createMutation.mutate(newItem);
    }
  };

  // ── Exports ───────────────────────────────────────────────────────────────

  const getExportName = () => {
    const raw = activeProjectName || '';
    return raw.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'export';
  };

  const exportPDF = () => {
    const projectName = activeProjectName || '';
    const doc = new jsPDF();
    doc.text(`Cadre Logique - ${projectName}`, 14, 15);
    (doc as any).autoTable({
      startY: 20,
      head: [['Niveau', 'Description / Indicateur', 'Baseline', 'Cible', 'Vérification', 'Hypothèses']],
      body: localData.map(row => [
        row.niveau_intervention,
        row.indicateur,
        row.valeur_reference || '',
        row.cible || '',
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
      localData.map(row => ({
        Niveau: row.niveau_intervention,
        Description: row.indicateur,
        Baseline: row.valeur_reference || '',
        Cible: row.cible || '',
        Vérification: row.source_verification || '',
        'Hypothèses/Risques': row.hypotheses || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cadre Logique');
    XLSX.writeFile(wb, `Cadre_Logique_${getExportName()}.xlsx`);
  };

  const hasImpact = localData.some(i => i.niveau_intervention === 'IMPACT');

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
          {!hasImpact && (
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
              data={localData}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onAddChild={handleAddChild}
            />
          )}
        </div>
      </div>

      {/* ── SLIDEOVER (Formulaire) ──────────────────────────────────────────── */}
      <LogframeForm
        open={isFormOpen}
        onOpenChange={open => {
          setIsFormOpen(open);
          if (!open) setEditingItem(null);
        }}
        initialData={editingItem || undefined}
        parentId={parentIdForNew}
        parentLevel={parentLevelForNew}
        onSubmit={handleSubmit}
      />

      {/* ── MODAL DE CONFIRMATION DE SUPPRESSION ───────────────────────────── */}
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
              &ldquo;{deleteTarget?.indicateur}&rdquo;
            </span>{' '}
            et tous ses éléments subordonnés ?
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
