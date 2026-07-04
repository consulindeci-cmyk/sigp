import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { DocumentProjet, PaginatedResponse } from '@/types';

export function useDocuments(projectId: string) {
  return useQuery({
    queryKey: ['documents', projectId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<DocumentProjet>>(
        `/projects/${projectId}/documents`,
      );
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateDocument(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Omit<DocumentProjet, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data } = await api.post<DocumentProjet>(
        `/projects/${projectId}/documents`,
        dto,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', projectId] }),
  });
}

export function useUpdateDocument(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<DocumentProjet> & { id: string }) => {
      const { data } = await api.patch<DocumentProjet>(
        `/projects/${projectId}/documents/${id}`,
        dto,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', projectId] }),
  });
}

export function useDeleteDocument(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      await api.delete(`/projects/${projectId}/documents/${documentId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', projectId] }),
  });
}
