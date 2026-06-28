import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { budgetValidationService } from '@/services/budgetValidationService';
import type { PPMLigne } from '@/types';

export function usePPM(versionId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['ppm-lignes', versionId],
    queryFn: async (): Promise<PPMLigne[]> => {
      const { data } = await api.get<PPMLigne[]>(`/ppm/versions/${versionId}/lignes`);
      return data;
    },
    enabled: !!versionId,
  });

  const addLigneMutation = useMutation({
    mutationFn: async (dto: Omit<PPMLigne, 'id' | 'version_hash' | 'statut' | 'ppm_version_id'>) => {
      const validation = await budgetValidationService.checkBudgetAvailability(
        dto.budget_ligne_id,
        dto.montant_estime_base
      );
      if (!validation.isAvailable) {
        throw new Error(validation.message);
      }
      const { data } = await api.post<PPMLigne>(`/ppm/versions/${versionId}/lignes`, dto);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ppm-lignes', versionId] }),
  });

  const updateLigneMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PPMLigne> }) => {
      if (updates.budget_ligne_id !== undefined || updates.montant_estime_base !== undefined) {
        const lignes = query.data ?? [];
        const existing = lignes.find((l) => l.id === id);
        if (existing) {
          const newBudgetLigneId = updates.budget_ligne_id ?? existing.budget_ligne_id;
          const newMontant = updates.montant_estime_base ?? existing.montant_estime_base;
          const validation = await budgetValidationService.checkBudgetAvailability(newBudgetLigneId, newMontant);
          if (!validation.isAvailable) {
            throw new Error(validation.message);
          }
        }
      }
      const { data } = await api.patch<PPMLigne>(`/ppm/lignes/${id}`, updates);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ppm-lignes', versionId] }),
  });

  const deleteLigneMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ppm/lignes/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ppm-lignes', versionId] }),
  });

  const totalEstimeBase = useMemo(
    () => (query.data ?? []).reduce((acc, ligne) => acc + ligne.montant_estime_base, 0),
    [query.data]
  );

  return {
    lignes: query.data ?? [],
    isLoading: query.isLoading,
    totalEstimeBase,
    addLigne: (dto: Omit<PPMLigne, 'id' | 'version_hash' | 'statut' | 'ppm_version_id'>) =>
      addLigneMutation.mutateAsync(dto),
    updateLigne: (id: string, updates: Partial<PPMLigne>) =>
      updateLigneMutation.mutateAsync({ id, updates }),
    deleteLigne: async (id: string): Promise<void> => {
      await deleteLigneMutation.mutateAsync(id);
    },
  };
}
