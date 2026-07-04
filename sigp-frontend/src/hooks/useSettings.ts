import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ConfigurationProjet, CategorieParametre, StatutParametre, PaginatedResponse } from '@/types';

// ─── Read ─────────────────────────────────────────────────────────────────────

export function useSettings(projectId: string) {
  return useQuery({
    queryKey: ['settings', projectId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ConfigurationProjet>>(
        `/projects/${projectId}/settings`,
      );
      return data;
    },
    enabled: !!projectId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface SettingPayload {
  categorie: CategorieParametre;
  nom: string;
  description: string;
  valeur: string;
  valeur_defaut: string;
  type_valeur: ConfigurationProjet['type_valeur'];
  requis: boolean;
  modifiable: boolean;
  statut: StatutParametre;
  date_modification: string;
  modifie_par: string;
}

export function useCreateSetting(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SettingPayload) =>
      api.post<ConfigurationProjet>(`/projects/${projectId}/settings`, payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings', projectId] }); },
  });
}

export function useUpdateSetting(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<SettingPayload> & { id: string }) =>
      api.patch<ConfigurationProjet>(`/projects/${projectId}/settings/${id}`, payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings', projectId] }); },
  });
}

export function useDeleteSetting(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/projects/${projectId}/settings/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings', projectId] }); },
  });
}
