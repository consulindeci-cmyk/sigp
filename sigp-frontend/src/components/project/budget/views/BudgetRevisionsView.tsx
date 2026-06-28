import type { BudgetVersion } from '@/types/budget';
import { WorkflowTimeline, type TimelineStep } from '@/components/common/workflow/WorkflowTimeline';
import { WorkflowLogTable, type WorkflowLogEntry } from '@/components/common/workflow/WorkflowLogTable';
import { formatMoney } from '@/utils/format';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent } from '@/components/ui/data-display/Card';

interface BudgetRevisionsViewProps {
  budgetVersion: BudgetVersion;
}

const mockWorkflowSteps: TimelineStep[] = [
  { id: 's1', label: 'Création du Budget Initial', status: 'COMPLETED', date: '2025-01-10T09:00:00Z', user: 'Jean Dupond', role: 'Responsable Financier' },
  { id: 's2', label: 'Soumission pour Validation', status: 'COMPLETED', date: '2025-01-12T14:30:00Z', user: 'Jean Dupond', role: 'Responsable Financier', comment: 'Budget prêt pour examen N1.' },
  { id: 's3', label: 'Validation N1 (Coordonnateur)', status: 'COMPLETED', date: '2025-01-15T10:15:00Z', user: 'Marie Curie', role: 'Coordonnateur Projet', comment: 'Budget aligné avec le PTBA. Approuvé.' },
  { id: 's4', label: 'Approbation Finale (Bailleur)', status: 'COMPLETED', date: '2025-02-01T14:30:00Z', user: 'Banque Mondiale', role: 'Bailleur', comment: 'Avis de Non-Objection (ANO) accordé.' },
];

const mockAuditLogs: WorkflowLogEntry[] = [
  { id: 'log4', date: '2025-02-01T14:30:00Z', utilisateur: 'Banque Mondiale', role: 'Bailleur', action: 'Validation Bailleur', statut_precedent: 'VALIDATION_N1', statut_nouveau: 'APPROUVE', commentaire: 'ANO reçu par email.' },
  { id: 'log3', date: '2025-01-15T10:15:00Z', utilisateur: 'Marie Curie', role: 'Coordonnateur', action: 'Validation N1', statut_precedent: 'SOUMIS', statut_nouveau: 'VALIDATION_N1', commentaire: 'Approbation technique.' },
  { id: 'log2', date: '2025-01-12T14:30:00Z', utilisateur: 'Jean Dupond', role: 'Resp. Financier', action: 'Soumission', statut_precedent: 'BROUILLON', statut_nouveau: 'SOUMIS' },
  { id: 'log1', date: '2025-01-10T09:00:00Z', utilisateur: 'Jean Dupond', role: 'Resp. Financier', action: 'Création', statut_nouveau: 'BROUILLON' },
];

function statutToBadge(statut: string) {
  switch (statut) {
    case 'APPROUVE':    return <Badge variant="success">{statut}</Badge>;
    case 'SOUMIS':      return <Badge variant="warning">{statut}</Badge>;
    case 'EN_REVISION': return <Badge variant="destructive">{statut}</Badge>;
    case 'BROUILLON':   return <Badge variant="secondary">{statut}</Badge>;
    default:            return <Badge variant="outline">{statut}</Badge>;
  }
}

export function BudgetRevisionsView({ budgetVersion }: BudgetRevisionsViewProps) {
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-[1000px] mx-auto w-full flex flex-col gap-6 p-6">

        {/* Version header */}
        <Card>
          <CardContent className="flex flex-wrap justify-between items-center gap-4 pt-6">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-3 flex-wrap">
                Version {budgetVersion.numero_version}
                {statutToBadge(budgetVersion.statut)}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Approuvé le {new Date(budgetVersion.approuve_le || '').toLocaleDateString('fr-FR')} par {budgetVersion.approuve_par}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1 font-medium">
                Budget Total Révisé (BAC)
              </div>
              <div className="text-2xl font-bold text-foreground font-mono">
                {formatMoney(budgetVersion.montant_total_revise)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline + Audit log */}
        <div className="flex gap-6 items-start flex-wrap">
          <div className="flex-1 basis-[300px] max-w-full">
            <WorkflowTimeline steps={mockWorkflowSteps} />
          </div>
          <div className="flex-[2] basis-[500px] min-w-0">
            <WorkflowLogTable logs={mockAuditLogs} />
          </div>
        </div>

      </div>
    </div>
  );
}
