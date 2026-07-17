import { useQuery } from '@tanstack/react-query';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Super Admin — vue macro plateforme.
// ─────────────────────────────────────────────────────────────────────────────

export interface SuperAdminOperationRecente {
  id: string;
  action: string;
  tableCible: string;
  element: string;
  auteurNom: string;
  auteurRole: string | null;
  createdAt: string;
}

export interface SuperAdminDashboardSummary {
  organisations: {
    total: number;
    actives: number;
    suspendues: number;
  };
  utilisateursTotal: number;
  finances: {
    budgetTotal: number;
    budgetActif: number;
    pctBudgetActif: number;
  };
  operationsRecentes: SuperAdminOperationRecente[];
  generatedAt: string;
}

export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: ['super-admin-dashboard'],
    queryFn: async (): Promise<SuperAdminDashboardSummary> => {
      return invokeEdgeFunction<SuperAdminDashboardSummary>('super-admin-dashboard-summary', {});
    },
    staleTime: 60_000,
  });
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'a créé',
  UPDATE: 'a modifié',
  DELETE: 'a supprimé',
  RESTORE: 'a restauré',
  LOGIN: "s'est connecté",
  LOGOUT: "s'est déconnecté",
  EXPORT: 'a exporté',
  VALIDATE: 'a validé',
  REJECT: 'a rejeté',
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.toLowerCase();
}

export function formatBudgetMacro(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} Md`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M`;
  return amount.toLocaleString('fr-FR');
}
