// ==========================================
// TYPES
// ==========================================

export type ConventionStatus = 'Active' | 'En négociation' | 'Clôturée' | 'Suspendue';
export type ConventionType = 'Prêt' | 'Don' | 'Subvention' | 'Contrepartie nationale';
export type Devise = 'USD' | 'EUR' | 'XOF' | 'GBP';

export interface FundingConvention {
  id: string;
  bailleur: string;
  refConvention: string;
  intitule: string;
  type: ConventionType;
  devise: Devise;
  montantTotal: number;
  montantEngage: number;
  montantDecaisse: number;
  dateSignature: string;
  dateExpiration: string;
  statut: ConventionStatus;
  pourcentageContribution: number;
  pourcentageDecaissement: number;
}

export interface FundingKPIs {
  montantTotal: string;
  nombreBailleurs: number;
  montantEngage: string;
  montantDecaisse: string;
  tauxDecaissement: number;
}

export interface FundingDistributionItem {
  name: string;
  value: number;
  color: string;
}

// ==========================================
// MOCK: CONVENTIONS DE FINANCEMENT
// ==========================================

export const mockFundingConventions: FundingConvention[] = [
  {
    id: 'fc1',
    bailleur: 'Agence Française de Développement',
    refConvention: 'AFD-NIG-2023-001',
    intitule: 'Convention de financement — Prêt concessionnel Phase I & II',
    type: 'Prêt',
    devise: 'EUR',
    montantTotal: 18500000,
    montantEngage: 18500000,
    montantDecaisse: 13875000,
    dateSignature: '2023-02-15',
    dateExpiration: '2028-12-31',
    statut: 'Active',
    pourcentageContribution: 45,
    pourcentageDecaissement: 75,
  },
  {
    id: 'fc2',
    bailleur: 'Banque Mondiale — IDA',
    refConvention: 'IDA-P178432-NIG-2023',
    intitule: 'Accord de financement IDA — Développement Rural Intégré',
    type: 'Don',
    devise: 'USD',
    montantTotal: 22000000,
    montantEngage: 20900000,
    montantDecaisse: 14300000,
    dateSignature: '2023-01-20',
    dateExpiration: '2029-06-30',
    statut: 'Active',
    pourcentageContribution: 35,
    pourcentageDecaissement: 65,
  },
  {
    id: 'fc3',
    bailleur: 'Union Européenne — FED',
    refConvention: 'UE-FED11-NIG-2023-047',
    intitule: 'Convention de contribution — Fonds Européen de Développement',
    type: 'Subvention',
    devise: 'EUR',
    montantTotal: 5200000,
    montantEngage: 4680000,
    montantDecaisse: 2808000,
    dateSignature: '2023-06-01',
    dateExpiration: '2027-05-31',
    statut: 'Active',
    pourcentageContribution: 13,
    pourcentageDecaissement: 54,
  },
  {
    id: 'fc4',
    bailleur: 'République du Niger — Trésor',
    refConvention: 'GVT-NIG-2023-CP-014',
    intitule: 'Contribution nationale — Contrepartie budgétaire état',
    type: 'Contrepartie nationale',
    devise: 'XOF',
    montantTotal: 2950000000,
    montantEngage: 2065000000,
    montantDecaisse: 1180000000,
    dateSignature: '2023-03-10',
    dateExpiration: '2028-12-31',
    statut: 'Active',
    pourcentageContribution: 7,
    pourcentageDecaissement: 40,
  },
];

// ==========================================
// MOCK: FUNDING KPIs
// ==========================================

export const mockFundingKPIs: FundingKPIs = {
  montantTotal: '47.65M USD',
  nombreBailleurs: 4,
  montantEngage: '44.08M USD',
  montantDecaisse: '30.96M USD',
  tauxDecaissement: 65,
};

// ==========================================
// MOCK: DISTRIBUTION RECHARTS
// ==========================================

export const mockFundingPieData: FundingDistributionItem[] = [
  { name: 'AFD (Prêt)', value: 45, color: 'var(--navy-700, #1e3a5f)' },
  { name: 'Banque Mondiale', value: 35, color: 'var(--primary, #2563eb)' },
  { name: 'Union Européenne', value: 13, color: 'var(--success, #22c55e)' },
  { name: 'Contrepartie nationale', value: 7, color: 'var(--muted-foreground, #94a3b8)' },
];
