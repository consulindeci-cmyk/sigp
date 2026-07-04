import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { CommentaireProjet, ModuleCommentaire, StatutCommentaire, PrioriteCommentaire, PaginatedResponse } from '@/types';

// ─── Read ─────────────────────────────────────────────────────────────────────

export function useComments(projectId: string) {
  return useQuery({
    queryKey: ['comments', projectId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CommentaireProjet>>(
        `/projects/${projectId}/comments`,
      );
      return data;
    },
    enabled: !!projectId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface CommentPayload {
  module: ModuleCommentaire;
  element_id: string;
  element_nom: string;
  auteur: string;
  role: string;
  message: string;
  statut: StatutCommentaire;
  priorite: PrioriteCommentaire;
  parent_id?: string | null;
  piece_jointe?: string | null;
  mention?: string | null;
  date_creation: string;
  date_modification: string;
  lu: boolean;
}

export function useCreateComment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CommentPayload) =>
      api.post<CommentaireProjet>(`/projects/${projectId}/comments`, payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', projectId] }); },
  });
}

export function useUpdateComment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<CommentPayload> & { id: string }) =>
      api.patch<CommentaireProjet>(`/projects/${projectId}/comments/${id}`, payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', projectId] }); },
  });
}

export function useDeleteComment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/projects/${projectId}/comments/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', projectId] }); },
  });
}
