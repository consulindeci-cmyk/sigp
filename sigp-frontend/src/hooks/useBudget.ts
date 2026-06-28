import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Budget, BudgetVersion } from '@/types/budget';

export function useBudget(projetId: string) {
  return useQuery({
    queryKey: ['budget', projetId],
    queryFn: async (): Promise<Budget> => {
      const { data } = await api.get<Budget>(`/projects/${projetId}/budget`);
      return data;
    },
    enabled: !!projetId,
  });
}

export function useBudgetVersion(projetId: string, versionId?: string) {
  return useQuery({
    queryKey: ['budget-version', projetId, versionId],
    queryFn: async (): Promise<BudgetVersion> => {
      const endpoint = versionId && versionId !== 'latest'
        ? `/projects/${projetId}/budget/versions/${versionId}`
        : `/projects/${projetId}/budget/versions/active`;
      const { data } = await api.get<BudgetVersion>(endpoint);
      return data;
    },
    enabled: !!projetId,
  });
}

export function useBudgetWorkflow(projetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { budgetId: string; nouveauStatut: string; commentaire?: string }) => {
      const { data } = await api.patch(
        `/projects/${projetId}/budget/versions/${payload.budgetId}/workflow`,
        { statut: payload.nouveauStatut, commentaire: payload.commentaire }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', projetId] });
      queryClient.invalidateQueries({ queryKey: ['budget-version', projetId] });
    },
  });
}
