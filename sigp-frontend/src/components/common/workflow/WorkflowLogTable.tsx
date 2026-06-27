import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface WorkflowLogEntry {
  id: string;
  utilisateur: string;
  role: string;
  action: string;
  commentaire?: string;
  date: string;
  statut_precedent?: string;
  statut_nouveau: string;
}

interface WorkflowLogTableProps {
  logs: WorkflowLogEntry[];
  isLoading?: boolean;
}

export const WorkflowLogTable = React.memo(({ logs, isLoading = false }: WorkflowLogTableProps) => {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line-strong)', background: 'var(--surface)' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--navy-900)' }}>Journal d'Audit</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--slate)' }}>Historique des actions de validation et commentaires.</p>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ background: 'var(--canvas)', color: 'var(--slate)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>Date & Heure</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>Utilisateur</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>Rôle</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>Action</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>Statut</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>Commentaire</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--slate)' }}>
                  Chargement de l'historique...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--slate)' }}>
                  Aucun log disponible.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const dateObj = new Date(log.date);
                return (
                  <tr key={log.id} style={{ transition: 'background 0.2s' }} className="hover:bg-gray-50">
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--navy-900)', fontFamily: 'monospace' }}>
                      {format(dateObj, 'dd MMM yyyy, HH:mm', { locale: fr })}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 500, color: 'var(--navy-900)' }}>
                      {log.utilisateur}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--slate)' }}>
                      {log.role}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--slate)' }}>
                        {log.statut_precedent && <span>{log.statut_precedent} &rarr;</span>}
                        <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{log.statut_nouveau}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--slate)', maxWidth: '300px' }}>
                      {log.commentaire || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

WorkflowLogTable.displayName = 'WorkflowLogTable';
