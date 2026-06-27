import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export interface TimelineStep {
  id: string;
  label: string; // ex: "Création", "Validation N1"
  status: 'COMPLETED' | 'CURRENT' | 'PENDING' | 'REJECTED';
  date?: string;
  user?: string;
  role?: string;
  comment?: string;
}

interface WorkflowTimelineProps {
  steps: TimelineStep[];
}

export const WorkflowTimeline = React.memo(({ steps }: WorkflowTimelineProps) => {
  return (
    <div className="panel" style={{ padding: '24px' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '15px', fontWeight: 600, color: 'var(--navy-900)' }}>Parcours de validation</h3>
      
      <div style={{ position: 'relative' }}>
        {/* Ligne verticale de fond */}
        <div style={{ position: 'absolute', left: '15px', top: '20px', bottom: '20px', width: '2px', background: 'var(--line-strong)', zIndex: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {steps.map((step, index) => {
            const isCompleted = step.status === 'COMPLETED';
            const isCurrent = step.status === 'CURRENT';
            const isRejected = step.status === 'REJECTED';
            
            let Icon = Clock;
            let iconColor = 'var(--slate)';
            let iconBg = 'var(--canvas)';
            
            if (isCompleted) {
              Icon = CheckCircle2;
              iconColor = 'white';
              iconBg = 'var(--green-600)';
            } else if (isCurrent) {
              Icon = AlertCircle;
              iconColor = 'white';
              iconBg = 'var(--blue-600)';
            } else if (isRejected) {
              Icon = XCircle;
              iconColor = 'white';
              iconBg = 'var(--red)';
            }

            return (
              <div key={step.id} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                
                {/* Icône du statut */}
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', background: iconBg, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: isCurrent ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : 'none',
                  border: isCompleted || isCurrent || isRejected ? 'none' : '2px solid var(--line-strong)'
                }}>
                  <Icon size={16} color={iconColor} />
                </div>

                {/* Contenu de l'étape */}
                <div style={{ flex: 1, paddingBottom: index !== steps.length - 1 ? '0' : '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: isCurrent ? 700 : 600, color: isCurrent ? 'var(--navy-900)' : 'var(--ink)' }}>
                      {step.label}
                    </h4>
                    {step.date && (
                      <span style={{ fontSize: '12px', color: 'var(--slate)', fontFamily: 'monospace' }}>
                        {format(new Date(step.date), 'dd MMM yyyy, HH:mm', { locale: fr })}
                      </span>
                    )}
                  </div>
                  
                  {step.user && (
                    <div style={{ fontSize: '13px', color: 'var(--slate)', marginBottom: '8px' }}>
                      Par <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{step.user}</span> {step.role && `(${step.role})`}
                    </div>
                  )}

                  {step.comment && (
                    <div style={{ 
                      background: 'var(--canvas)', padding: '12px', borderRadius: '6px', 
                      fontSize: '13px', color: 'var(--ink)', borderLeft: `3px solid ${isRejected ? 'var(--red)' : 'var(--line-strong)'}`
                    }}>
                      "{step.comment}"
                    </div>
                  )}
                </div>
                
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

WorkflowTimeline.displayName = 'WorkflowTimeline';
