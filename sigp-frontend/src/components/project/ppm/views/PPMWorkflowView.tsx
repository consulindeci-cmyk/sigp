import React, { useState, useMemo } from 'react';
import { Send, CheckCircle2, XCircle, Archive, ChevronRight } from 'lucide-react';
import { PPMVersion, StatutPPM } from '@/types';
import { WorkflowTimeline } from '@/components/common/workflow/WorkflowTimeline';
import { WorkflowLogTable } from '@/components/common/workflow/WorkflowLogTable';
import type { WorkflowLogEntry } from '@/components/common/workflow/WorkflowLogTable';
import type { TimelineStep } from '@/components/common/workflow/WorkflowTimeline';
import type { WorkflowAction } from '@/hooks/usePPMVersions';

interface PPMWorkflowViewProps {
  version: PPMVersion;
  workflowSteps: TimelineStep[];
  workflowLogs: WorkflowLogEntry[];
  availableActions: WorkflowAction[];
  onExecuteAction: (action: WorkflowAction, payload: { utilisateur: string; role: string; commentaire?: string }) => Promise<void>;
}

// Configuration des boutons d'action selon le type d'action
const ACTION_CONFIG: Record<WorkflowAction, {
  label: string;
  icon: React.ElementType;
  style: 'primary' | 'success' | 'danger' | 'warning';
  requiresComment: boolean;
}> = {
  SOUMETTRE: { label: 'Soumettre pour revue', icon: Send, style: 'primary', requiresComment: false },
  VALIDER_N1: { label: 'Valider (N1)', icon: CheckCircle2, style: 'success', requiresComment: false },
  DEMANDER_ANO: { label: "Envoyer au Bailleur (ANO)", icon: ChevronRight, style: 'primary', requiresComment: false },
  APPROUVER: { label: 'Approuver Définitivement', icon: CheckCircle2, style: 'success', requiresComment: false },
  REJETER: { label: 'Rejeter', icon: XCircle, style: 'danger', requiresComment: true },
  CLOTURER: { label: 'Clôturer le PPM', icon: Archive, style: 'warning', requiresComment: false },
};

const BTN_STYLES: Record<string, React.CSSProperties> = {
  primary: {
    background: 'var(--blue-600)', color: 'white',
    border: 'none', borderRadius: '8px',
    padding: '10px 20px', fontWeight: 600, fontSize: '13px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
  },
  success: {
    background: 'var(--green-600)', color: 'white',
    border: 'none', borderRadius: '8px',
    padding: '10px 20px', fontWeight: 600, fontSize: '13px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
  },
  danger: {
    background: 'white', color: 'var(--red-600)',
    border: '1.5px solid var(--red-300)', borderRadius: '8px',
    padding: '10px 20px', fontWeight: 600, fontSize: '13px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
  },
  warning: {
    background: '#f59e0b1a', color: '#b45309',
    border: '1.5px solid #fcd34d', borderRadius: '8px',
    padding: '10px 20px', fontWeight: 600, fontSize: '13px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
  },
};

export function PPMWorkflowView({
  version,
  workflowSteps,
  workflowLogs,
  availableActions,
  onExecuteAction,
}: PPMWorkflowViewProps) {
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState('');

  // L'action "rejet" requiert un commentaire — on l'extrait si disponible
  const requiresComment = useMemo(
    () => availableActions.some(a => ACTION_CONFIG[a]?.requiresComment),
    [availableActions]
  );

  const handleAction = async (action: WorkflowAction) => {
    if (ACTION_CONFIG[action].requiresComment && !commentaire.trim()) {
      setActionError('Un commentaire est obligatoire pour cette action.');
      return;
    }
    setIsActing(true);
    setActionError(null);
    try {
      await onExecuteAction(action, {
        utilisateur: 'Utilisateur Connecté',
        role: 'Coordinateur',
        commentaire: commentaire.trim() || undefined,
      });
      setCommentaire('');
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors de l\'exécution de l\'action.');
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

      {/* Colonne Gauche : Timeline + Journal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <WorkflowTimeline steps={workflowSteps} />
        <WorkflowLogTable logs={workflowLogs} />
      </div>

      {/* Colonne Droite : Panneau d'actions + Info version */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '16px' }}>

        {/* Carte Info Version */}
        <div className="panel" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Informations Version
          </h3>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <dt style={{ color: 'var(--slate)' }}>Version</dt>
              <dd style={{ fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>{version.numero_version}</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <dt style={{ color: 'var(--slate)' }}>Créée par</dt>
              <dd style={{ fontWeight: 500, margin: 0 }}>{version.cree_par}</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <dt style={{ color: 'var(--slate)' }}>Budget de référence</dt>
              <dd style={{ fontFamily: 'monospace', fontSize: '12px', margin: 0 }}>{version.budget_version_reference}</dd>
            </div>
            {version.approuve_par && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <dt style={{ color: 'var(--slate)' }}>Approuvé par</dt>
                <dd style={{ fontWeight: 600, color: 'var(--green-700)', margin: 0 }}>{version.approuve_par}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Panneau des Actions */}
        {availableActions.length > 0 ? (
          <div className="panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Actions Disponibles
            </h3>

            {actionError && (
              <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', color: '#dc2626' }}>
                {actionError}
              </div>
            )}

            {requiresComment && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--navy-800)', marginBottom: '6px' }}>
                  Commentaire (obligatoire pour le rejet)
                </label>
                <textarea
                  value={commentaire}
                  onChange={e => setCommentaire(e.target.value)}
                  placeholder="Motif du rejet, corrections à apporter..."
                  style={{
                    width: '100%', minHeight: '80px', padding: '10px 12px',
                    border: '1px solid var(--line-soft)', borderRadius: '6px',
                    fontSize: '13px', fontFamily: 'inherit', resize: 'vertical',
                    outline: 'none', background: 'var(--canvas)', boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {availableActions.map(action => {
                const config = ACTION_CONFIG[action];
                const Icon = config.icon;
                return (
                  <button
                    key={action}
                    style={{ ...BTN_STYLES[config.style], opacity: isActing ? 0.6 : 1 }}
                    disabled={isActing}
                    onClick={() => handleAction(action)}
                  >
                    <Icon size={16} />
                    {isActing ? 'En cours...' : config.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="panel" style={{ padding: '20px', textAlign: 'center' }}>
            <Archive size={32} style={{ color: 'var(--slate)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: 'var(--slate)', margin: 0 }}>
              {version.statut === 'CLOTURE'
                ? 'Ce PPM est clôturé. Aucune action disponible.'
                : 'Aucune action disponible pour ce statut.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
