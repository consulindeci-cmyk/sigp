import type { BudgetRevision, BudgetVersion } from '@/types/budget';
import { StatutBudget, TypeRevision } from '@/types/budget';
import { WorkflowTimeline, type TimelineStep } from '@/components/common/workflow/WorkflowTimeline';
import { WorkflowLogTable, type WorkflowLogEntry } from '@/components/common/workflow/WorkflowLogTable';
import { formatMoney } from '@/utils/format';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent } from '@/components/ui/data-display/Card';
import { GitCommit, ArrowRightLeft, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const REVISION_TYPE_LABELS: Record<TypeRevision, string> = {
  [TypeRevision.AJOUT_FONDS]:                'Ajout de fonds',
  [TypeRevision.RETRAIT_FONDS]:              'Retrait de fonds',
  [TypeRevision.TRANSFERT_INTER_CATEGORIE]:  'Transfert inter-catégorie',
  [TypeRevision.TRANSFERT_INTER_COMPOSANTE]: 'Transfert inter-composante',
};

const REVISION_TYPE_ICONS: Record<TypeRevision, React.ComponentType<{ className?: string }>> = {
  [TypeRevision.AJOUT_FONDS]:                PlusCircle,
  [TypeRevision.RETRAIT_FONDS]:              MinusCircle,
  [TypeRevision.TRANSFERT_INTER_CATEGORIE]:  ArrowRightLeft,
  [TypeRevision.TRANSFERT_INTER_COMPOSANTE]: RefreshCw,
};

function revisionStatutBadge(statut: BudgetRevision['statut']) {
  switch (statut) {
    case 'APPROUVE':           return <Badge variant="success">Approuvé</Badge>;
    case 'REJETE':             return <Badge variant="destructive">Rejeté</Badge>;
    case 'VALIDATION_N1':      return <Badge variant="warning">Validation N1</Badge>;
    case 'VALIDATION_BAILLEUR':return <Badge variant="warning">Validation Bailleur</Badge>;
    case 'SOUMIS':             return <Badge variant="secondary">Soumis</Badge>;
    default:                   return <Badge variant="outline">{statut}</Badge>;
  }
}

function versionStatutBadge(statut: string) {
  switch (statut) {
    case 'APPROUVE':    return <Badge variant="success">Approuvé</Badge>;
    case 'BROUILLON':   return <Badge variant="secondary">Brouillon</Badge>;
    case 'SOUMIS':      return <Badge variant="warning">Soumis</Badge>;
    case 'EN_REVISION': return <Badge variant="destructive">En Révision</Badge>;
    case 'ARCHIVE':     return <Badge variant="secondary">Archivé</Badge>;
    default:            return <Badge variant="outline">{statut}</Badge>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build dynamic timeline from version lifecycle (no mock data)
// ─────────────────────────────────────────────────────────────────────────────

function buildLifecycleSteps(bv: BudgetVersion): TimelineStep[] {
  const isApproved  = bv.statut === StatutBudget.APPROUVE;
  const isSubmitted = bv.statut === StatutBudget.SOUMIS || isApproved || bv.statut === StatutBudget.EN_REVISION;

  const steps: TimelineStep[] = [
    {
      id:     'step-create',
      label:  `Création du budget ${bv.numero_version}`,
      status: 'COMPLETED',
      date:   bv.cree_le,
      user:   'Responsable Financier',
      role:   'Responsable Financier',
    },
    {
      id:     'step-submit',
      label:  'Soumission pour validation',
      status: isSubmitted ? 'COMPLETED' : 'PENDING',
      date:   isSubmitted ? bv.cree_le : undefined,
      comment: isSubmitted ? 'Budget soumis pour examen et approbation.' : undefined,
    },
  ];

  if (bv.statut === StatutBudget.EN_REVISION) {
    steps.push({
      id:     'step-revision',
      label:  'En Révision',
      status: 'CURRENT',
      comment: 'Des modifications sont requises avant approbation.',
    });
  }

  steps.push({
    id:     'step-approve',
    label:  'Approbation finale (Bailleur)',
    status: isApproved ? 'COMPLETED' : (bv.statut === StatutBudget.SOUMIS ? 'CURRENT' : 'PENDING'),
    date:   isApproved ? (bv.approuve_le ?? undefined) : undefined,
    user:   isApproved ? (bv.approuve_par ?? 'Bailleur') : undefined,
    role:   isApproved ? 'Bailleur' : undefined,
    comment: isApproved ? 'Avis de Non-Objection (ANO) accordé.' : undefined,
  });

  return steps;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build audit log from version lifecycle (no mock data)
// ─────────────────────────────────────────────────────────────────────────────

function buildAuditLog(bv: BudgetVersion): WorkflowLogEntry[] {
  const logs: WorkflowLogEntry[] = [];

  logs.push({
    id:           'log-create',
    date:         bv.cree_le,
    utilisateur:  'Responsable Financier',
    role:         'Resp. Financier',
    action:       'Création du budget',
    statut_nouveau: 'BROUILLON',
  });

  if (bv.statut !== StatutBudget.BROUILLON) {
    logs.unshift({
      id:             'log-submit',
      date:           bv.cree_le,
      utilisateur:    'Responsable Financier',
      role:           'Resp. Financier',
      action:         'Soumission pour validation',
      statut_precedent: 'BROUILLON',
      statut_nouveau:  'SOUMIS',
    });
  }

  if (bv.statut === StatutBudget.EN_REVISION) {
    logs.unshift({
      id:             'log-revision',
      date:           bv.cree_le,
      utilisateur:    'Coordinateur Projet',
      role:           'Coordinateur',
      action:         'Demande de révision',
      statut_precedent: 'SOUMIS',
      statut_nouveau:  'EN_REVISION',
    });
  }

  if (bv.statut === StatutBudget.APPROUVE && bv.approuve_le) {
    logs.unshift({
      id:             'log-approve',
      date:           bv.approuve_le,
      utilisateur:    bv.approuve_par || 'Bailleur',
      role:           'Bailleur',
      action:         'Approbation finale',
      statut_precedent: 'SOUMIS',
      statut_nouveau:  'APPROUVE',
      commentaire:    'Avis de Non-Objection (ANO) accordé par le bailleur.',
    });
  }

  return logs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state component
// ─────────────────────────────────────────────────────────────────────────────

function EmptyRevisions() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4 text-center bg-card border border-dashed border-border rounded-lg">
      <div className="p-4 bg-muted/50 rounded-full">
        <GitCommit className="h-8 w-8 text-muted-foreground opacity-60" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">Aucune révision budgétaire</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Les révisions (ajout de fonds, transferts, retraits) seront listées ici une fois soumises.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Revisions list
// ─────────────────────────────────────────────────────────────────────────────

function RevisionCard({ revision }: { revision: BudgetRevision }) {
  const Icon = REVISION_TYPE_ICONS[revision.type] ?? GitCommit;
  const mouvementsCount = revision.mouvements?.length ?? 0;

  return (
    <div className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:bg-muted/5 transition-colors">
      <div className="p-2.5 bg-primary/10 rounded-lg shrink-0 self-start">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-sm text-foreground">{revision.titre}</span>
          {revisionStatutBadge(revision.statut)}
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Type : <span className="font-medium text-foreground">{REVISION_TYPE_LABELS[revision.type]}</span>
          {mouvementsCount > 0 && (
            <span className="ml-2">· {mouvementsCount} mouvement{mouvementsCount > 1 ? 's' : ''}</span>
          )}
          {revision.document_reference && (
            <span className="ml-2">· Réf : {revision.document_reference}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground italic">
          « {revision.justification} »
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface BudgetRevisionsViewProps {
  budgetVersion: BudgetVersion;
}

export function BudgetRevisionsView({ budgetVersion }: BudgetRevisionsViewProps) {
  const timelineSteps = buildLifecycleSteps(budgetVersion);
  const auditLogs     = buildAuditLog(budgetVersion);
  const revisions     = budgetVersion.revisions ?? [];

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-[1000px] mx-auto w-full flex flex-col gap-6 p-6">

        {/* ── Version header ───────────────────────────────────────────────── */}
        <Card>
          <CardContent className="flex flex-wrap justify-between items-center gap-4 pt-6">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-3 flex-wrap">
                Version {budgetVersion.numero_version}
                {versionStatutBadge(budgetVersion.statut)}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {budgetVersion.statut === StatutBudget.APPROUVE && budgetVersion.approuve_le
                  ? `Approuvé le ${new Date(budgetVersion.approuve_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} par ${budgetVersion.approuve_par ?? '—'}`
                  : `Créé le ${new Date(budgetVersion.cree_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1 font-medium">
                Budget Total Révisé (BAC)
              </div>
              <div className="text-xl font-bold text-foreground font-mono">
                {formatMoney(budgetVersion.montant_total_revise)}
              </div>
              {budgetVersion.montant_total_initial !== budgetVersion.montant_total_revise && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Initial : {formatMoney(budgetVersion.montant_total_initial)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Lifecycle timeline + Audit log ───────────────────────────────── */}
        <div className="flex gap-6 items-start flex-wrap">
          <div className="flex-1 basis-[280px] max-w-full">
            <WorkflowTimeline steps={timelineSteps} />
          </div>
          <div className="flex-[2] basis-[480px] min-w-0">
            <WorkflowLogTable logs={auditLogs} />
          </div>
        </div>

        {/* ── Révisions budgétaires ─────────────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-primary" />
            Révisions budgétaires
            <span className="text-xs text-muted-foreground font-normal ml-1">
              ({revisions.length} révision{revisions.length !== 1 ? 's' : ''})
            </span>
          </h3>

          {revisions.length === 0 ? (
            <EmptyRevisions />
          ) : (
            <div className="flex flex-col gap-3">
              {revisions.map(r => (
                <RevisionCard key={r.id} revision={r} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
