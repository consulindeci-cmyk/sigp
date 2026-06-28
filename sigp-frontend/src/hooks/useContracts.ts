import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractService } from '../services/contractService';
import type { Contract } from '../types/contract';

export function useContracts(projectId: string) {
  return useQuery({
    queryKey: ['contracts', projectId],
    queryFn: () => contractService.getContracts(projectId),
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
    mutationFn: (dto: Partial<Contract>) => contractService.createContract(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts', projectId] }),
  });
}

export function useUpdateContract(projectId: string, contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, versionHash }: { data: Partial<Contract>; versionHash: string }) =>
      contractService.updateContract(contractId, data, versionHash),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts', projectId] }),
  });
}

export function useDeleteContract(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contractId: string) => contractService.deleteContract(contractId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts', projectId] }),
  });
}
