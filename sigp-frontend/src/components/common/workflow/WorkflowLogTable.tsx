import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/Card';

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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Journal d'Audit</CardTitle>
        <CardDescription>Historique des actions de validation et commentaires.</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted text-muted-foreground uppercase text-[11px] font-semibold tracking-wide">
              <tr>
                <th className="px-4 py-3 border-b border-border">Date & Heure</th>
                <th className="px-4 py-3 border-b border-border">Utilisateur</th>
                <th className="px-4 py-3 border-b border-border">Rôle</th>
                <th className="px-4 py-3 border-b border-border">Action</th>
                <th className="px-4 py-3 border-b border-border">Statut</th>
                <th className="px-4 py-3 border-b border-border">Commentaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Chargement de l'historique...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Aucun log disponible.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateObj = new Date(log.date);
                  return (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {format(dateObj, 'dd MMM yyyy, HH:mm', { locale: fr })}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {log.utilisateur}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.role}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {log.action}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {log.statut_precedent && <span>{log.statut_precedent} &rarr;</span>}
                          <span className="font-semibold text-foreground">{log.statut_nouveau}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[300px] truncate">
                        {log.commentaire || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});

WorkflowLogTable.displayName = 'WorkflowLogTable';
