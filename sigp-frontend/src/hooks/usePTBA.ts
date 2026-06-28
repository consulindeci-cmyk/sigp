import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { PTBA, StatutPTBA } from '@/types';

export function usePTBA(projectId: string, annee: number) {
  return useQuery({
    queryKey: ['ptba', projectId, annee],
    queryFn: async () => {
      const { data } = await api.get<PTBA>(`/projects/${projectId}/ptba/${annee}`);
      return { data };
    },
    enabled: !!projectId && !!annee,
  });
}

export function useWorkflowPTBA(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ptbaId, nouveauStatut, commentaire }: { ptbaId: string; nouveauStatut: StatutPTBA; commentaire?: string }) => {
      const { data } = await api.patch(`/projects/${projectId}/ptba/${ptbaId}/workflow`, {
        statut: nouveauStatut,
        commentaire,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ptba', projectId] });
    },
  });
}
