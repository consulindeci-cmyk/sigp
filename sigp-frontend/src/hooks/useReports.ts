import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { RapportProjet, PaginatedResponse } from '@/types';

export function useReports(projectId: string) {
  return useQuery({
    queryKey: ['reports', projectId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<RapportProjet>>(
        `/projects/${projectId}/reports`,
      );
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateReport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Omit<RapportProjet, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data } = await api.post<RapportProjet>(
        `/projects/${projectId}/reports`,
        dto,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', projectId] }),
  });
}

export function useUpdateReport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<RapportProjet> & { id: string }) => {
      const { data } = await api.patch<RapportProjet>(
        `/projects/${projectId}/reports/${id}`,
        dto,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', projectId] }),
  });
}

export function useDeleteReport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) => {
      await api.delete(`/projects/${projectId}/reports/${reportId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', projectId] }),
  });
}
