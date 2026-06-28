import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useBudget, useBudgetVersion, useBudgetWorkflow } from '@/hooks/useBudget';
import { formatMoney } from '@/utils/format';
import {
  GitCommit, CheckCircle2, AlertCircle, LayoutGrid,
  TrendingUp, DollarSign, Loader2, PieChart, Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/data-display/Badge';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Button } from '@/components/ui/forms/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/navigation/Tabs';
import { BudgetMatrix } from '@/components/project/budget/views/BudgetMatrix';
import { BudgetRevisionsView } from '@/components/project/budget/views/BudgetRevisionsView';
import { BudgetAnalyticsDashboard } from '@/components/project/budget/views/BudgetAnalyticsDashboard';
import { VersionSelector } from '@/components/common/workflow/VersionSelector';
import type { BudgetVersion } from '@/types/budget';

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

function MatrixContent({
  isLoading, error, budgetVersion,
}: {
  isLoading: boolean;
  error: unknown;
  budgetVersion?: BudgetVersion;
}) {
  if (isLoading)      return <LoadingView />;
  if (error)          return <ErrorView />;
  if (!budgetVersion) return <EmptyBudgetView />;
  return <BudgetMatrix budgetVersion={budgetVersion} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// BudgetPage
// ─────────────────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId }  = useUIStore();
  const resolvedProjectId    = urlProjectId || activeProjectId || '';

  const [versionSelectionnee, setVersionSelectionnee] = useState<string>('latest');

  const { data: budget, isLoading: isLoadingBudget, error: errorBudget } = useBudget(resolvedProjectId);
  const { data: budgetVersion, isLoading: isLoadingVersion }             = useBudgetVersion(resolvedProjectId, versionSelectionnee);
  const workflowMutation = useBudgetWorkflow(resolvedProjectId);

  const isLoading = isLoadingBudget || isLoadingVersion;
  const error     = errorBudget;

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

  function handleActionWorkflow(action: 'SOUMETTRE' | 'APPROUVER' | 'REJETER') {
    if (!budget) return;
    let targetStatus = budgetVersion?.statut || 'BROUILLON';
    if (action === 'SOUMETTRE') targetStatus = 'SOUMIS';
    if (action === 'APPROUVER') targetStatus = 'APPROUVE';
    workflowMutation.mutate({
      budgetId: budget.id,
      nouveauStatut: targetStatus,
      commentaire: `Action : ${action}`,
    });
  }

  const totalBAC        = budgetVersion?.montant_total_revise || 0;
  const totalPreEngage  = budgetVersion?.lignes?.reduce((acc, l) => acc + l.montant_pre_engage, 0) || 0;
  const totalEngage     = budgetVersion?.lignes?.reduce((acc, l) => acc + l.montant_engage,     0) || 0;
  const totalDecaisse   = budgetVersion?.lignes?.reduce((acc, l) => acc + l.montant_decaisse,   0) || 0;
  const totalDisponible = budgetVersion?.lignes?.reduce((acc, l) => acc + l.solde_disponible,   0) || 0;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-start justify-between gap-4 px-6 py-4 border-b border-border bg-card">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Budget &amp; Suivi Financier
            </h1>
            {renderStatusBadge(budgetVersion?.statut)}
          </div>
          <p className="text-sm text-muted-foreground">
            Suivi de l'exécution financière · version {budgetVersion?.numero_version || '—'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <VersionSelector
            versions={[
              {
                id: 'latest',
                label: budgetVersion?.numero_version || 'Actuelle',
                isActive: true,
                statut: budgetVersion?.statut || 'BROUILLON',
              },
              { id: 'v1.0', label: 'v1.0', description: 'Budget Initial', isActive: false, statut: 'ARCHIVE' },
            ]}
            selectedId={versionSelectionnee}
            onChange={setVersionSelectionnee}
          />

          {budgetVersion?.statut === 'BROUILLON' && (
            <Button
              size="sm"
              variant="default"
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => handleActionWorkflow('SOUMETTRE')}
              disabled={workflowMutation.isPending}
            >
              Soumettre
            </Button>
          )}

          {budgetVersion?.statut === 'SOUMIS' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleActionWorkflow('REJETER')}
                disabled={workflowMutation.isPending}
              >
                Rejeter
              </Button>
              <Button
                size="sm"
                variant="default"
                className="bg-success hover:bg-success/90 text-success-foreground"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => handleActionWorkflow('APPROUVER')}
                disabled={workflowMutation.isPending}
              >
                Approuver
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── KPI STRIP ───────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-6 py-4 border-b border-border bg-muted/10">
        <StatCard
          title="Budget Révisé (BAC)"
          value={formatMoney(totalBAC)}
          icon={<Wallet className="h-4 w-4 text-primary" />}
          iconVariant="primary"
        />
        <StatCard
          title="Pré-engagements"
          value={formatMoney(totalPreEngage)}
          icon={<TrendingUp className="h-4 w-4 text-warning" />}
          iconVariant="warning"
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
          icon={<DollarSign className="h-4 w-4 text-info" />}
          iconVariant="info"
        />
      </div>

      {/* ── TABS + CONTENT ──────────────────────────────────────────────── */}
      <Tabs defaultValue="matrix" className="flex flex-col flex-1 min-h-0 p-4 gap-0">
        <TabsList className="shrink-0 self-start mb-3 h-auto gap-0.5">
          <TabsTrigger value="matrix" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <LayoutGrid className="h-3.5 w-3.5" />
            Matrice Globale
          </TabsTrigger>
          <TabsTrigger value="finances" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-3.5 w-3.5" />
            Financements
          </TabsTrigger>
          <TabsTrigger value="revisions" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <GitCommit className="h-3.5 w-3.5" />
            Révisions
          </TabsTrigger>
          <TabsTrigger value="bi" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <PieChart className="h-3.5 w-3.5" />
            Dashboard BI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="flex-1 min-h-0 overflow-hidden mt-0">
          <MatrixContent isLoading={isLoading} error={error} budgetVersion={budgetVersion} />
        </TabsContent>

        <TabsContent value="finances" className="flex-1 overflow-auto mt-0">
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <DollarSign className="h-10 w-10 opacity-40" />
            <p className="text-base font-semibold text-foreground">Suivi des Financements</p>
            <p className="text-sm text-center max-w-sm">
              Cette vue sera développée lors d'une prochaine étape, conformément au Master Document.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="revisions" className="flex-1 min-h-0 overflow-hidden mt-0">
          {budgetVersion
            ? <BudgetRevisionsView budgetVersion={budgetVersion} />
            : <EmptyBudgetView />
          }
        </TabsContent>

        <TabsContent value="bi" className="flex-1 min-h-0 overflow-hidden mt-0">
          {budgetVersion
            ? <BudgetAnalyticsDashboard budgetVersion={budgetVersion} />
            : <EmptyBudgetView />
          }
        </TabsContent>
      </Tabs>

    </div>
  );
}
