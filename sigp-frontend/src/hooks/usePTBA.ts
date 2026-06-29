import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockPTBA } from '@/mocks/ptbaMock';
import type { StatutPTBA } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function usePTBA(projectId: string, annee: number) {
  return useQuery({
    queryKey: ['ptba', projectId, annee],
    queryFn: async () => {
      await delay(500);
      return { data: { ...mockPTBA, annee } };
    },
    enabled: !!projectId && !!annee,
  });
}

export function useWorkflowPTBA(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ptbaId: _ptbaId,
      nouveauStatut: _nouveauStatut,
      commentaire: _commentaire,
    }: {
      ptbaId: string;
      nouveauStatut: StatutPTBA;
      commentaire?: string;
    }) => {
      await delay(500);
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ptba', projectId] });
    },
  });
}
