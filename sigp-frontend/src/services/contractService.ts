import { Contract, ContractAmendment, ContractDeliverable } from '../types/contract';

/**
 * Service métier vide pour la Gestion des Contrats (Phase 7 - Étape 1).
 * Il sera connecté à l'API lors d'une phase ultérieure.
 */
export const contractService = {
  getContracts: async (projectId: string): Promise<Contract[]> => {
    // API call will go here
    return [];
  },
  
  getContractById: async (contractId: string): Promise<Contract | null> => {
    return null;
  },

  createContract: async (contractData: Partial<Contract>): Promise<Contract> => {
    throw new Error("Not implemented");
  },

  updateContract: async (contractId: string, contractData: Partial<Contract>, versionHash: string): Promise<Contract> => {
    throw new Error("Not implemented");
  },

  deleteContract: async (contractId: string): Promise<void> => {
    throw new Error("Not implemented");
  }
};
