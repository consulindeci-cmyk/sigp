import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import {
  adaptOrganisationRow,
  type OrganisationOverviewRow,
  type OrganisationRow,
  type UpdateOrganisationAdminPayload,
  type CreateOrganisationAdminPayload,
} from '@/lib/organisationAdapter';

// ─────────────────────────────────────────────────────────────────────────────
// Hooks — Page Super Admin "Organisations"
// Le nombre d'organisations reste modeste (un tenant par client) : la liste
// complète est chargée en un seul appel, tri/recherche/KPI se calculent
// côté client sur ce tableau déjà en mémoire — pas de pagination serveur
// comme pour le module Users (dimensionné, lui, pour des milliers de lignes).
// ─────────────────────────────────────────────────────────────────────────────

export const organisationsAdminKeys = {
  all: ['organisations-admin'] as const,
  list: () => [...organisationsAdminKeys.all, 'list'] as const,
};

export function useOrganisationsList() {
  return useQuery({
    queryKey: organisationsAdminKeys.list(),
    queryFn: async (): Promise<OrganisationRow[]> => {
      const { data } = await invokeEdgeFunction<{ data: OrganisationOverviewRow[] }>('organisations-list', {});
      return (data ?? []).map(adaptOrganisationRow);
    },
    staleTime: 30_000,
  });
}

export function useCreateOrganisationAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateOrganisationAdminPayload) => {
      return invokeEdgeFunction<{ data: { organisation: unknown; admin: unknown }; warning?: string }>(
        'organisations-create',
        { ...payload }
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: organisationsAdminKeys.list() }),
  });
}

export function useUpdateOrganisationAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateOrganisationAdminPayload) => {
      // organisations-update renvoie la ligne brute de la table organisations
      // (pas le format agrégé) — on ignore la valeur, la liste est invalidée
      // et refetchée avec les compteurs à jour juste après.
      return invokeEdgeFunction<{ data: Record<string, unknown> }>('organisations-update', { ...payload });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: organisationsAdminKeys.list() }),
  });
}
