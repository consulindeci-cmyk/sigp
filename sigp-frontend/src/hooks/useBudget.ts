import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockBudget, mockBudgetVersion } from '@/mocks/budgetMock';
import type { Budget, BudgetVersion } from '@/types/budget';

// Simulation délai réseau
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
      return mockBudgetVersion;
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
    }
  });
}
