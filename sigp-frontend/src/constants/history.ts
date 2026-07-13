export type HistoryAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'VALIDATE' | 'REJECT';

// Libellés et couleurs des 8 actions réellement émises par AuditAction (Prisma) —
// aucune catégorie fictive (ex: "Téléchargement", "Import", "Archivage") n'a
// d'équivalent backend aujourd'hui et n'est donc pas proposée ici.

export const ACTION_LABEL: Record<HistoryAction, string> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  EXPORT: 'Export',
  VALIDATE: 'Validation',
  REJECT: 'Rejet',
};

export const ACTION_OPTIONS: { value: HistoryAction; label: string }[] = (
  Object.keys(ACTION_LABEL) as HistoryAction[]
).map((value) => ({ value, label: ACTION_LABEL[value] }));

export type ActionBadgeVariant =
  | 'default' | 'success' | 'destructive' | 'warning' | 'secondary' | 'info' | 'outline';

export function actionBadgeVariant(action: HistoryAction): ActionBadgeVariant {
  switch (action) {
    case 'CREATE': return 'success';
    case 'UPDATE': return 'default';
    case 'DELETE': return 'destructive';
    case 'LOGIN': return 'info';
    case 'LOGOUT': return 'secondary';
    case 'EXPORT': return 'warning';
    case 'VALIDATE': return 'success';
    case 'REJECT': return 'destructive';
    default: return 'secondary';
  }
}
