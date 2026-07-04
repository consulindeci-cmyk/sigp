import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type {
  DocumentGlobal, CategorieGlobalDoc, StatutGlobalDoc,
  ConfidentialiteGlobalDoc, TypeFichier, PaginatedResponse,
} from '@/types';

// ─── Read ─────────────────────────────────────────────────────────────────────

export function useGlobalDocuments() {
  return useQuery({
    queryKey: ['global-documents'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<DocumentGlobal>>('/documents/global');
      return data;
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface GlobalDocumentPayload {
  titre: string;
  description: string;
  categorie: CategorieGlobalDoc;
  type: TypeFichier;
  statut: StatutGlobalDoc;
  version: string;
  confidentialite: ConfidentialiteGlobalDoc;
  auteur: string;
  service: string;
  mots_cles: string[];
  taille_ko: number;
  date_creation: string;
  date_modification: string;
  date_expiration?: string;
}

export function useCreateGlobalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GlobalDocumentPayload) =>
      api.post<DocumentGlobal>('/documents/global', payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['global-documents'] }); },
  });
}

export function useUpdateGlobalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<GlobalDocumentPayload> & { id: string }) =>
      api.patch<DocumentGlobal>(`/documents/global/${id}`, payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['global-documents'] }); },
  });
}

export function useDeleteGlobalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/documents/global/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['global-documents'] }); },
  });
}
