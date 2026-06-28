import api from '@/lib/axios';
import type { Contract } from '../types/contract';

export const contractService = {
  getContracts: async (projectId: string): Promise<Contract[]> => {
    const { data } = await api.get<Contract[]>(`/projects/${projectId}/contracts`);
    return data;
  },

  getContractById: async (contractId: string): Promise<Contract | null> => {
    const { data } = await api.get<Contract>(`/contracts/${contractId}`);
    return data;
  },

  createContract: async (contractData: Partial<Contract>): Promise<Contract> => {
    const { data } = await api.post<Contract>('/contracts', contractData);
    return data;
  },

  updateContract: async (contractId: string, contractData: Partial<Contract>, versionHash: string): Promise<Contract> => {
    const { data } = await api.patch<Contract>(`/contracts/${contractId}`, {
      ...contractData,
      version_hash: versionHash,
    });
    return data;
  },

  deleteContract: async (contractId: string): Promise<void> => {
    await api.delete(`/contracts/${contractId}`);
  },
};
