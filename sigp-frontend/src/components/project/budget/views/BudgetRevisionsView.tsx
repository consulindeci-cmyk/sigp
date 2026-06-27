import React from 'react';
import type { BudgetVersion } from '@/types/budget';
import { WorkflowTimeline, TimelineStep } from '@/components/common/workflow/WorkflowTimeline';
import { WorkflowLogTable, WorkflowLogEntry } from '@/components/common/workflow/WorkflowLogTable';
import { formatMoney } from '@/utils/format';

interface BudgetRevisionsViewProps {
  budgetVersion: BudgetVersion;
}

// Mocks internes temporaires pour l'Étape 3
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

export function BudgetRevisionsView({ budgetVersion }: BudgetRevisionsViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', background: 'var(--canvas)', padding: '24px' }} className="custom-scrollbar">
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* En-tête de la version */}
        <div className="panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Version {budgetVersion.numero_version}
              <span className="chip chip-success" style={{ fontSize: '11px' }}>{budgetVersion.statut}</span>
            </h2>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--slate)' }}>
              Approuvé le {new Date(budgetVersion.approuve_le || '').toLocaleDateString('fr-FR')} par {budgetVersion.approuve_par}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Budget Total Révisé (BAC)</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy-900)', fontFamily: 'monospace' }}>
              {formatMoney(budgetVersion.montant_total_revise)}
            </div>
          </div>
        </div>

        {/* Layout Colonnes : Timeline & Logs (Responsive) */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          <div style={{ flex: '1 1 300px', maxWidth: '100%' }}>
            <WorkflowTimeline steps={mockWorkflowSteps} />
          </div>
          
          <div style={{ flex: '2 1 500px', minWidth: 0 }}>
            <WorkflowLogTable logs={mockAuditLogs} />
          </div>

        </div>

      </div>
    </div>
  );
}
