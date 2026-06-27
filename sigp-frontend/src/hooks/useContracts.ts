import { useState, useEffect } from 'react';
import { Contract, ContractVersion } from '../types/contract';
import { contractService } from '../services/contractService';

// Données Mock pour la fondation du module
const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'c-001',
    projet_id: 'p-001',
    wbs_id: 'wbs-1',
    budget_ligne_id: 'bl-001',
    ppm_ligne_id: 'ppm-001',
    bailleur_id: 'b-001',
    fournisseur_id: 'f-102',
    reference: 'CTR-2026-001',
    intitule: 'Acquisition de serveurs pour le Datacenter',
    statut: 'EN_EXECUTION',
    devise_code: 'XOF',
    taux_change_contractuel: 1,
    montant_initial_devise: 150000000,
    montant_initial_base: 150000000,
    date_signature: '2026-01-15',
    date_ordre_service: '2026-02-01',
    fin_prevue: '2026-08-01',
    garantie_bonne_execution_taux: 5,
    version_hash: 'abc123hash'
  }
];

export function useContracts(projectId: string) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des mocks
    const loadData = async () => {
      setIsLoading(true);
      // En production, on utiliserait: await contractService.getContracts(projectId);
      setTimeout(() => {
        setContracts(MOCK_CONTRACTS);
        setIsLoading(false);
      }, 500);
    };
    
    loadData();
  }, [projectId]);

  return {
    contracts,
    isLoading
  };
}

export function useContractVersions(contractId: string) {
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Hook vide pour la fondation
  return {
    versions,
    isLoading
  };
}
