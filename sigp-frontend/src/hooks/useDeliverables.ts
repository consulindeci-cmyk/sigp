import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Livrable, PaginatedResponse } from '@/types';

export function useDeliverables(projectId: string) {
  return useQuery({
    queryKey: ['deliverables', projectId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Livrable>>(
        `/projects/${projectId}/deliverables`,
      );
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Omit<Livrable, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data } = await api.post<Livrable>(
        `/projects/${projectId}/deliverables`,
        dto,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deliverables', projectId] }),
  });
}

export function useUpdateDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Livrable> & { id: string }) => {
      const { data } = await api.patch<Livrable>(
        `/projects/${projectId}/deliverables/${id}`,
        dto,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deliverables', projectId] }),
  });
}

export function useDeleteDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (livrableId: string) => {
      await api.delete(`/projects/${projectId}/deliverables/${livrableId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deliverables', projectId] }),
  });
}
