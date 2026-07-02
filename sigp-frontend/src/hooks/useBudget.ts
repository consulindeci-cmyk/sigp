import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockBudget, ALL_BUDGET_VERSIONS } from '@/mocks/budgetMock';
import type { Budget, BudgetVersion } from '@/types/budget';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useBudget(projetId: string) {
  return useQuery({
    queryKey: ['budget', projetId],
    queryFn: async (): Promise<Budget> => {
      await delay(800);
      return mockBudget;
    },
    enabled: !!projetId,
  });
}

export function useBudgetVersion(projetId: string, versionId?: string) {
  return useQuery({
    queryKey: ['budget-version', projetId, versionId],
    queryFn: async (): Promise<BudgetVersion> => {
      await delay(500);
      // Return the matching version, or the active version as fallback
      const found = ALL_BUDGET_VERSIONS.find(v => v.id === versionId || v.numero_version === versionId);
      return found ?? ALL_BUDGET_VERSIONS[0];
    },
    enabled: !!projetId,
  });
}

export function useBudgetWorkflow(projetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { budgetId: string; nouveauStatut: string; commentaire?: string }) => {
      await delay(1000);
      return { success: true, statut: payload.nouveauStatut };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', projetId] });
      queryClient.invalidateQueries({ queryKey: ['budget-version', projetId] });
    },
  });
}
