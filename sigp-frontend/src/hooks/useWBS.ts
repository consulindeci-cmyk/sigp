import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { WBS } from '@/types';

export function useWBS(projectId: string) {
  return useQuery({
    queryKey: ['wbs', projectId],
    queryFn: async () => {
      const { data } = await api.get<WBS[]>(`/projects/${projectId}/wbs`);
      return { data };
    },
    enabled: !!projectId,
  });
}

export function useUpdateWBSOrder(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; parent_id?: string | null; ordre: number }[]) => {
      const { data } = await api.patch(`/projects/${projectId}/wbs/reorder`, { items });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wbs', projectId] }),
  });
}
