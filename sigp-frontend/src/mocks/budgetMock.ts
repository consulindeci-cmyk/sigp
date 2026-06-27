import { Budget, BudgetVersion, StatutBudget } from '@/types/budget';

export const mockBudgetLignes = [
  {
    id: 'l-001',
    budget_version_id: 'v1.0-1',
    version: 1,
    wbs_id: 'wbs-3-1',
    bailleur_id: 'BM',
    source_financement_id: 'PRET',
    categorie_id: 'TRAVAUX',
    compte_comptable_id: '611000',
    montant_initial: 5000000,
    montant_revise: 5000000,
    montant_pre_engage: 500000,
    montant_engage: 3000000,
    montant_liquide: 1500000,
    montant_decaisse: 1000000,
    solde_disponible: 1500000, // 5M - (0.5M + 3M)
    reste_a_payer: 2000000, // 3M - 1M
    wbs_nom: 'Construction Ligne HT',
    bailleur_nom: 'Banque Mondiale'
  },
  {
    id: 'l-002',
    budget_version_id: 'v1.0-1',
    version: 1,
    wbs_id: 'wbs-3-2',
    bailleur_id: 'AFD',
    source_financement_id: 'DON',
    categorie_id: 'BIENS',
    compte_comptable_id: '612000',
    montant_initial: 2000000,
    montant_revise: 2000000,
    montant_pre_engage: 0,
    montant_engage: 1500000,
    montant_liquide: 1500000,
    montant_decaisse: 1500000,
    solde_disponible: 500000,
    reste_a_payer: 0,
    wbs_nom: 'Équipements Postes',
    bailleur_nom: 'AFD'
  },
  {
    id: 'l-003',
    budget_version_id: 'v1.0-1',
    version: 1,
    wbs_id: 'wbs-1-1',
    bailleur_id: 'ETAT',
    source_financement_id: 'CONTREPARTIE',
    categorie_id: 'FONCTIONNEMENT',
    compte_comptable_id: '621000',
    montant_initial: 500000,
    montant_revise: 550000, // Après petite révision
    montant_pre_engage: 50000,
    montant_engage: 300000,
    montant_liquide: 100000,
    montant_decaisse: 100000,
    solde_disponible: 200000,
    reste_a_payer: 200000,
    wbs_nom: 'UGP Salaires & Locaux',
    bailleur_nom: 'État'
  }
];

export const mockBudgetVersion: BudgetVersion = {
  id: 'v1.0-1',
  budget_id: 'b-001',
  numero_version: 'v1.0',
  statut: StatutBudget.APPROUVE,
  montant_total_initial: 7500000,
  montant_total_revise: 7550000,
  cree_le: '2025-01-15T10:00:00Z',
  approuve_le: '2025-02-01T14:30:00Z',
  approuve_par: 'user-001',
  lignes: mockBudgetLignes,
  revisions: []
};

export const mockBudget: Budget = {
  id: 'b-001',
  projet_id: 'PROJ-014',
  devise_ref_id: 'USD',
  cree_par: 'user-001',
  cree_le: '2025-01-10T09:00:00Z',
  version_active_id: 'v1.0-1',
  versions: [mockBudgetVersion]
};
