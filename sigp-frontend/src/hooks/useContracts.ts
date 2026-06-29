import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockContracts } from '@/mocks/contractsMock';
import type { Contract } from '../types/contract';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useContracts(projectId: string) {
  return useQuery({
    queryKey: ['contracts', projectId],
    queryFn: async (): Promise<Contract[]> => {
      await delay(500);
      return mockContracts;
    },
    enabled: !!projectId,
  });
}

export function useContractVersions(_contractId: string) {
  return {
    versions: [],
    isLoading: false,
  };
}

export function useCreateContract(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<Contract>): Promise<Contract> => {
      await delay(600);
      return {
        id: `c-${Date.now()}`,
        projet_id: projectId,
        wbs_id: dto.wbs_id || '',
        budget_ligne_id: dto.budget_ligne_id || '',
        ppm_ligne_id: dto.ppm_ligne_id || '',
        bailleur_id: dto.bailleur_id || '',
        fournisseur_id: dto.fournisseur_id || '',
        reference: dto.reference || '',
        intitule: dto.intitule || '',
        statut: dto.statut || 'BROUILLON',
        devise_code: dto.devise_code || 'XOF',
        taux_change_contractuel: dto.taux_change_contractuel || 1,
        montant_initial_devise: dto.montant_initial_devise || 0,
        montant_initial_base: dto.montant_initial_base || 0,
        version_hash: `hash-${Date.now()}`,
        ...dto,
      } as Contract;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts', projectId] }),
  });
}

export function useUpdateContract(projectId: string, _contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data: _data, versionHash: _versionHash }: { data: Partial<Contract>; versionHash: string }) => {
      await delay(600);
      return { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts', projectId] }),
  });
}

export function useDeleteContract(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_contractId: string) => {
      await delay(400);
      return { success: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts', projectId] }),
  });
}
