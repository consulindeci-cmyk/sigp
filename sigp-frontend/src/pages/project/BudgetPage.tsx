import { PageHeader } from '@/components/layout/PageHeader';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import {
  useBudget, useBudgetVersion, useBudgetWorkflow,
  useCreateBudgetLine, useUpdateBudgetLine, useDeleteBudgetLine,
} from '@/hooks/useBudget';
import { formatMoney } from '@/utils/format';
import { StatutBudget } from '@/types/budget';
import type { BudgetLigne, BudgetVersion } from '@/types/budget';
import type { LigneHistoryEntry, ImportResult } from '@/components/project/budget/views/BudgetMatrix';
import type { VersionItem } from '@/components/common/workflow/VersionSelector';
import {
  GitCommit, CheckCircle2, AlertCircle, LayoutGrid,
  Banknote, Loader2, Wallet, BarChart2,
} from 'lucide-react';
import { Badge } from '@/components/ui/data-display/Badge';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Button } from '@/components/ui/forms/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/navigation/Tabs';
import { BudgetMatrix } from '@/components/project/budget/views/BudgetMatrix';
import { VersionSelector } from '@/components/common/workflow/VersionSelector';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderStatusBadge(statut?: string) {
  switch (statut) {
    case 'APPROUVE':    return <Badge variant="success">Approuvé</Badge>;
    case 'BROUILLON':   return <Badge variant="secondary">Brouillon</Badge>;
    case 'SOUMIS':      return <Badge variant="warning">Soumis</Badge>;
    case 'EN_REVISION': return <Badge variant="destructive">En Révision</Badge>;
    case 'ARCHIVE':     return <Badge variant="secondary">Archivé</Badge>;
    default:            return <Badge variant="outline">{statut ?? 'N/A'}</Badge>;
  }
}

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
      <p className="text-xs text-muted-foreground">Impossible de charger le Budget.</p>
    </div>
  );
}

function EmptyBudgetView() {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-3 text-muted-foreground">
      <GitCommit className="h-10 w-10 opacity-40" />
      <p className="text-base font-semibold text-foreground">Aucun Budget actif</p>
      <p className="text-sm">Le budget de ce projet n'a pas encore été initialisé.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MatrixContent wrapper
// ─────────────────────────────────────────────────────────────────────────────

interface MatrixContentProps {
  isLoading:        boolean;
  error:            unknown;
  budgetVersion?:   BudgetVersion;
  lignes:           BudgetLigne[];
  lineHistory:      LigneHistoryEntry[];
  projectId:        string;
  canManage:        boolean;
  canDelete:        boolean;
  onAddLigne:       (data: Partial<BudgetLigne>) => Promise<void>;
  onEditLigne:      (id: string, data: Partial<BudgetLigne>) => Promise<void>;
  onDeleteLigne:    (id: string) => Promise<void>;
  onDuplicateLigne: (id: string) => Promise<void>;
  onImportLignes:   (lignes: Partial<BudgetLigne>[]) => Promise<ImportResult>;
}

function MatrixContent({
  isLoading, error, budgetVersion,
  lignes, lineHistory, projectId, canManage, canDelete,
  onAddLigne, onEditLigne, onDeleteLigne, onDuplicateLigne, onImportLignes,
}: MatrixContentProps) {
  if (isLoading)      return <LoadingView />;
  if (error)          return <ErrorView />;
  if (!budgetVersion) return <EmptyBudgetView />;
  return (
    <BudgetMatrix
      lignes={lignes}
      lineHistory={lineHistory}
      projectId={projectId}
      canManage={canManage}
      canDelete={canDelete}
      onAddLigne={onAddLigne}
      onEditLigne={onEditLigne}
      onDeleteLigne={onDeleteLigne}
      onDuplicateLigne={onDuplicateLigne}
      onImportLignes={onImportLignes}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FundingRedirectView — l'ancien onglet "Financements" agrégeait les lignes
// budgétaires locales par bailleur_id sans jamais lire ni écrire dans la
// vraie table funding_sources (cf. audit Budget / Sources de Financement) —
// un troisième concept de "bailleur" totalement déconnecté des deux autres
// (BudgetLigneSlideOver + le vrai écran ProjectFundingTab). Remplacé par un
// simple renvoi vers l'écran réel, seule source de vérité pour les bailleurs.
// ─────────────────────────────────────────────────────────────────────────────

function FundingRedirectView({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <BarChart2 className="h-10 w-10 text-muted-foreground opacity-40" aria-hidden="true" />
      <div>
        <p className="text-base font-semibold text-foreground mb-1">Gestion des Sources de Financement</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Les bailleurs, contreparties et leur répartition se gèrent désormais depuis l'écran dédié
          « Sources de Financement », connecté aux vraies données du projet.
        </p>
      </div>
      <Button variant="default" size="sm" onClick={onNavigate}>
        <BarChart2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
        Aller aux Sources de Financement
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Unique ID generator
// ─────────────────────────────────────────────────────────────────────────────

function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BudgetPage
// ─────────────────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId, setActiveProjectTab } = useUIStore();
  const resolvedProjectId    = urlProjectId || activeProjectId || '';

  // Empty string → hook returns active version (v2.0 in mock)
  const [versionSelectionnee, setVersionSelectionnee] = useState<string>('');

  const { data: budget, isLoading: isLoadingBudget, error: errorBudget } = useBudget(resolvedProjectId);
  const { data: budgetVersion, isLoading: isLoadingVersion } = useBudgetVersion(resolvedProjectId, versionSelectionnee);
  const workflowMutation = useBudgetWorkflow(resolvedProjectId);
  const createLineMutation = useCreateBudgetLine(versionSelectionnee);
  const updateLineMutation = useUpdateBudgetLine(versionSelectionnee);
  const deleteLineMutation = useDeleteBudgetLine(versionSelectionnee);

  const isLoading = isLoadingBudget || isLoadingVersion;
  const error     = errorBudget;

  // Miroir des rôles serveur (requireRole) sur budget-lines-*/budget-versions-update
  // (COORDINATEUR/CHARGE_PROGRAMME/FINANCIER/ADMIN/SUPER_ADMIN) et *-delete (ADMIN/SUPER_ADMIN).
  const currentRole = useAuthStore(s => s.user?.role);
  const hasManageRole = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const hasDeleteRole = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  // Verrouillage du workflow : une version SOUMIS ou APPROUVE passe le tableau
  // en lecture seule — seule une version BROUILLON reste éditable, quel que
  // soit le rôle (cf. audit Budget).
  const isBrouillon = budgetVersion?.statut === StatutBudget.BROUILLON;
  const canManage = hasManageRole && isBrouillon;
  const canDelete = hasDeleteRole && isBrouillon;

  // Pas de miroir d'état local (cf. audit Budget) : les lignes affichées
  // proviennent directement de la source de vérité (budgetVersion.lignes),
  // rafraîchies par l'invalidation de cache après chaque mutation.
  const [lineHistory, setLineHistory] = useState<LigneHistoryEntry[]>([]);
  const displayLignes = budgetVersion?.lignes ?? [];

  // Set active version once budget loads
  useEffect(() => {
    if (budget?.version_active_id && !versionSelectionnee) {
      setVersionSelectionnee(budget.version_active_id);
    }
  }, [budget?.version_active_id, versionSelectionnee]);

  // Purge l'historique de session au changement de version
  useEffect(() => {
    setLineHistory([]);
  }, [budgetVersion?.id]);

  // ── Bannières workflow (Soumettre/Approuver/Rejeter) ──────────────────────
  const [workflowError,   setWorkflowError]   = useState<string | null>(null);
  const [workflowSuccess, setWorkflowSuccess] = useState<string | null>(null);

  if (!resolvedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Aucun projet sélectionné</h2>
        <p className="text-sm text-muted-foreground">
          Veuillez sélectionner un projet pour afficher son Budget.
        </p>
      </div>
    );
  }

  // ── Version items (dynamic from budget.versions) ──────────────────────────
  const versionItems = useMemo((): VersionItem[] => {
    if (!budget?.versions?.length) return [];
    const STATUT_LABELS: Record<StatutBudget, string> = {
      [StatutBudget.BROUILLON]:   'Brouillon',
      [StatutBudget.SOUMIS]:      'Soumis',
      [StatutBudget.EN_REVISION]: 'En révision',
      [StatutBudget.APPROUVE]:    'Approuvé',
      [StatutBudget.ARCHIVE]:     'Archivé',
    };
    return budget.versions.map(v => ({
      id:          v.id,
      label:       v.numero_version,
      description: STATUT_LABELS[v.statut] ?? v.statut,
      isActive:    v.id === budget.version_active_id,
      statut:      v.statut,
    }));
  }, [budget]);

  // ── Workflow ──────────────────────────────────────────────────────────────
  // Plus de mise à jour optimiste aveugle : le badge de statut affiché vient
  // toujours de budgetVersion.statut (refetch serveur déclenché par
  // useBudgetWorkflow.onSuccess) — jamais dupliqué en état local.
  function handleActionWorkflow(action: 'SOUMETTRE' | 'APPROUVER' | 'REJETER') {
    if (!budget || !budgetVersion) return;
    let newStatut = budgetVersion.statut;
    if (action === 'SOUMETTRE') newStatut = StatutBudget.SOUMIS;
    if (action === 'APPROUVER') newStatut = StatutBudget.APPROUVE;
    if (action === 'REJETER')   newStatut = StatutBudget.BROUILLON;

    setWorkflowError(null);
    setWorkflowSuccess(null);
    workflowMutation.mutate(
      {
        budgetId:      budget.id,
        versionId:     versionSelectionnee,
        nouveauStatut: newStatut,
        commentaire:   `Action : ${action}`,
      },
      {
        onSuccess: () => {
          setWorkflowSuccess('Statut du budget mis à jour avec succès.');
          setTimeout(() => setWorkflowSuccess(null), 3000);
        },
        onError: (err) => setWorkflowError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.'),
      }
    );
  }

  // ── CRUD réel (Edge Functions) + historique de session ────────────────────
  // Toutes les données envoyées correspondent désormais à une colonne réelle
  // en base (cf. audit Budget / migration budget_lignes_wbs_valorisation) —
  // plus d'overlay client pour bailleur/WBS/valorisation.

  function toLinePayload(data: Partial<BudgetLigne>) {
    return {
      libelle:         data.libelle || '',
      categorie:       data.categorie_id || undefined,
      montantPrevu:    data.montant_revise ?? 0,
      wbsId:           data.wbs_id || undefined,
      unite:           data.unite || undefined,
      quantite:        data.quantite ?? undefined,
      coutUnitaire:    data.cout_unitaire ?? undefined,
      fundingSourceId: data.bailleur_id || undefined,
    };
  }

  async function handleAddLigne(data: Partial<BudgetLigne>) {
    const { data: created } = await createLineMutation.mutateAsync({
      versionId: versionSelectionnee,
      codeLigne: data.code_ligne || uid('bl'),
      ...toLinePayload(data),
    });
    if (created?.id) {
      setLineHistory(prev => [...prev, {
        id: uid('h'), ligneId: created.id, action: 'CREATION',
        date: new Date().toISOString(), user: 'Utilisateur', after: data,
      }]);
    }
  }

  async function handleEditLigne(id: string, data: Partial<BudgetLigne>) {
    const before = displayLignes.find(l => l.id === id);
    await updateLineMutation.mutateAsync({ id, ...toLinePayload(data) });
    setLineHistory(prev => [...prev, {
      id: uid('h'), ligneId: id, action: 'MODIFICATION',
      date: new Date().toISOString(), user: 'Utilisateur', before, after: data,
    }]);
  }

  async function handleDeleteLigne(id: string) {
    const deleted = displayLignes.find(l => l.id === id);
    await deleteLineMutation.mutateAsync(id);
    setLineHistory(prev => [...prev, {
      id: uid('h'), ligneId: id, action: 'SUPPRESSION',
      date: new Date().toISOString(), user: 'Utilisateur',
      comment: deleted ? `Ligne "${deleted.libelle || deleted.code_ligne}" supprimée` : undefined,
      before: deleted,
    }]);
  }

  async function handleDuplicateLigne(id: string) {
    const source = displayLignes.find(l => l.id === id);
    if (!source) return;
    const { data: created } = await createLineMutation.mutateAsync({
      versionId: versionSelectionnee,
      codeLigne: `${source.code_ligne}-copy`,
      ...toLinePayload(source),
      libelle:   source.libelle ? `${source.libelle} (copie)` : '',
    });
    if (created?.id) {
      setLineHistory(prev => [...prev, {
        id: uid('h'), ligneId: created.id, action: 'DUPLICATION',
        date: new Date().toISOString(), user: 'Utilisateur',
        comment: `Dupliqué depuis "${source.libelle || source.code_ligne}"`, after: source,
      }]);
    }
  }

  async function handleImportLignes(newLignes: Partial<BudgetLigne>[]): Promise<ImportResult> {
    let succeeded = 0;
    const failed: ImportResult['failed'] = [];
    for (const data of newLignes) {
      try {
        const { data: created } = await createLineMutation.mutateAsync({
          versionId: versionSelectionnee,
          codeLigne: data.code_ligne || uid('bl-import'),
          ...toLinePayload(data),
        });
        succeeded += 1;
        if (created?.id) {
          setLineHistory(prev => [...prev, {
            id: uid('h'), ligneId: created.id, action: 'CREATION',
            date: new Date().toISOString(), user: 'Import Excel',
            comment: 'Importé depuis fichier Excel', after: data,
          }]);
        }
      } catch (err) {
        failed.push({
          libelle: data.libelle || data.code_ligne || '—',
          error:   err instanceof Error ? err.message : 'Erreur inconnue',
        });
      }
    }
    return { succeeded, failed };
  }

  // ── KPIs (100% source serveur) ────────────────────────────────────────────
  const totalBAC        = useMemo(() => displayLignes.reduce((s, l) => s + l.montant_revise,     0), [displayLignes]);
  const totalEngage     = useMemo(() => displayLignes.reduce((s, l) => s + l.montant_engage,     0), [displayLignes]);
  const totalDecaisse   = useMemo(() => displayLignes.reduce((s, l) => s + l.montant_decaisse,   0), [displayLignes]);
  const totalDisponible = useMemo(() => displayLignes.reduce((s, l) => s + l.solde_disponible,   0), [displayLignes]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-start justify-between gap-4 px-6 py-4 border-b border-border bg-card">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <PageHeader title="Budget &amp; Suivi Financier" />
            {renderStatusBadge(budgetVersion?.statut)}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suivi de l'exécution financière · version {budgetVersion?.numero_version || '—'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {versionItems.length > 0 && (
            <VersionSelector
              versions={versionItems}
              selectedId={versionSelectionnee}
              onChange={setVersionSelectionnee}
            />
          )}

          {hasManageRole && budgetVersion?.statut === StatutBudget.BROUILLON && (
            <Button
              size="sm" variant="default"
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => handleActionWorkflow('SOUMETTRE')}
              disabled={workflowMutation.isPending}
            >
              {workflowMutation.isPending ? 'Envoi...' : 'Soumettre'}
            </Button>
          )}

          {hasManageRole && budgetVersion?.statut === StatutBudget.SOUMIS && (
            <>
              <Button
                size="sm" variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleActionWorkflow('REJETER')}
                disabled={workflowMutation.isPending}
              >
                Rejeter
              </Button>
              <Button
                size="sm" variant="default"
                className="bg-success hover:bg-success/90 text-success-foreground"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => handleActionWorkflow('APPROUVER')}
                disabled={workflowMutation.isPending}
              >
                {workflowMutation.isPending ? 'Envoi...' : 'Approuver'}
              </Button>
            </>
          )}
        </div>
      </div>

      {(workflowError || workflowSuccess) && (
        <div
          className={`shrink-0 mx-6 mt-3 flex items-center gap-2 text-xs rounded-md px-3 py-2 border ${
            workflowError
              ? 'text-destructive bg-destructive/10 border-destructive/20'
              : 'text-success bg-success/10 border-success/20'
          }`}
          role="alert"
        >
          {workflowError ? <AlertCircle className="h-3.5 w-3.5 shrink-0" /> : <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
          {workflowError || workflowSuccess}
        </div>
      )}

      {/* ── KPI STRIP ───────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-6 py-4 border-b border-border bg-muted/10">
        <StatCard
          title="Budget Révisé (BAC)"
          value={formatMoney(totalBAC)}
          icon={<Wallet className="h-4 w-4 text-primary" />}
          iconVariant="primary"
        />
        <StatCard
          title="Engagements (Contrats)"
          value={formatMoney(totalEngage)}
          icon={<LayoutGrid className="h-4 w-4 text-warning" />}
          iconVariant="warning"
        />
        <StatCard
          title="Décaissements"
          value={formatMoney(totalDecaisse)}
          icon={<CheckCircle2 className="h-4 w-4 text-success" />}
          iconVariant="success"
        />
        <StatCard
          title="Solde Disponible"
          value={formatMoney(totalDisponible)}
          icon={<Banknote className="h-4 w-4 text-info" />}
          iconVariant="info"
        />
      </div>

      {/* ── TABS ────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="matrix" className="flex flex-col flex-1 min-h-0 p-4 gap-0">
        <TabsList className="shrink-0 self-start mb-3 h-auto gap-0.5 max-w-full overflow-x-auto flex-nowrap justify-start scrollbar-thin">
          <TabsTrigger value="matrix" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <LayoutGrid className="h-3.5 w-3.5" />
            Matrice Globale
          </TabsTrigger>
          <TabsTrigger value="finances" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <BarChart2 className="h-3.5 w-3.5" />
            Financements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="flex-1 min-h-0 overflow-hidden mt-0">
          <MatrixContent
            isLoading={isLoading}
            error={error}
            budgetVersion={budgetVersion}
            lignes={displayLignes}
            lineHistory={lineHistory}
            projectId={resolvedProjectId}
            canManage={canManage}
            canDelete={canDelete}
            onAddLigne={handleAddLigne}
            onEditLigne={handleEditLigne}
            onDeleteLigne={handleDeleteLigne}
            onDuplicateLigne={handleDuplicateLigne}
            onImportLignes={handleImportLignes}
          />
        </TabsContent>

        <TabsContent value="finances" className="flex-1 min-h-0 overflow-hidden mt-0">
          <FundingRedirectView onNavigate={() => setActiveProjectTab('funding')} />
        </TabsContent>
      </Tabs>

    </div>
  );
}
