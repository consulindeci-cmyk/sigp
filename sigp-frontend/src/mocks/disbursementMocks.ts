// ==========================================
// TYPES
// ==========================================

export type DisbursementStatus = 'Reçu' | 'En attente' | 'Planifié' | 'En retard';
export type DisbursementDevise = 'USD' | 'EUR' | 'XOF';

export interface DisbursementRecord {
  id: string;
  bailleur: string;
  convention: string;
  reference: string;
  tranche: string;
  montantPrevu: number;
  montantRecu: number;
  solde: number;
  datePrevue: string;
  dateReception: string | null;
  statut: DisbursementStatus;
  devise: DisbursementDevise;
}

export interface DisbursementKPIs {
  montantTotalPrevu: string;
  montantTotalRecu: string;
  tauxDecaissement: number;
  nombreRecu: number;
  nombreEnAttente: number;
  nombreEnRetard: number;
}

export interface DisbursementChartPoint {
  mois: string;
  prevu: number;
  recu: number;
}

// ==========================================
// MOCK: RECORDS (10 tranches réalistes)
// ==========================================

export const mockDisbursementRecords: DisbursementRecord[] = [
  {
    id: 'd1',
    bailleur: 'AFD',
    convention: 'AFD-NIG-2023-001',
    reference: 'DEC-AFD-2023-001',
    tranche: 'Tranche 1',
    montantPrevu: 4625000,
    montantRecu: 4625000,
    solde: 0,
    datePrevue: '2023-06-15',
    dateReception: '2023-06-10',
    statut: 'Reçu',
    devise: 'EUR',
  },
  {
    id: 'd2',
    bailleur: 'AFD',
    convention: 'AFD-NIG-2023-001',
    reference: 'DEC-AFD-2024-002',
    tranche: 'Tranche 2',
    montantPrevu: 4625000,
    montantRecu: 4387500,
    solde: 237500,
    datePrevue: '2024-01-15',
    dateReception: '2024-01-22',
    statut: 'Reçu',
    devise: 'EUR',
  },
  {
    id: 'd3',
    bailleur: 'AFD',
    convention: 'AFD-NIG-2023-001',
    reference: 'DEC-AFD-2025-003',
    tranche: 'Tranche 3',
    montantPrevu: 4625000,
    montantRecu: 0,
    solde: 4625000,
    datePrevue: '2025-07-01',
    dateReception: null,
    statut: 'En attente',
    devise: 'EUR',
  },
  {
    id: 'd4',
    bailleur: 'AFD',
    convention: 'AFD-NIG-2023-001',
    reference: 'DEC-AFD-2026-004',
    tranche: 'Tranche 4',
    montantPrevu: 4625000,
    montantRecu: 0,
    solde: 4625000,
    datePrevue: '2026-06-01',
    dateReception: null,
    statut: 'Planifié',
    devise: 'EUR',
  },
  {
    id: 'd5',
    bailleur: 'Banque Mondiale',
    convention: 'IDA-P178432-NIG-2023',
    reference: 'DEC-BM-2023-001',
    tranche: 'Tranche 1',
    montantPrevu: 5500000,
    montantRecu: 5500000,
    solde: 0,
    datePrevue: '2023-04-01',
    dateReception: '2023-04-05',
    statut: 'Reçu',
    devise: 'USD',
  },
  {
    id: 'd6',
    bailleur: 'Banque Mondiale',
    convention: 'IDA-P178432-NIG-2023',
    reference: 'DEC-BM-2024-002',
    tranche: 'Tranche 2',
    montantPrevu: 5500000,
    montantRecu: 5500000,
    solde: 0,
    datePrevue: '2024-04-01',
    dateReception: '2024-04-12',
    statut: 'Reçu',
    devise: 'USD',
  },
  {
    id: 'd7',
    bailleur: 'Banque Mondiale',
    convention: 'IDA-P178432-NIG-2023',
    reference: 'DEC-BM-2025-003',
    tranche: 'Tranche 3',
    montantPrevu: 5500000,
    montantRecu: 0,
    solde: 5500000,
    datePrevue: '2025-04-01',
    dateReception: null,
    statut: 'En retard',
    devise: 'USD',
  },
  {
    id: 'd8',
    bailleur: 'Union Européenne',
    convention: 'UE-FED11-NIG-2023-047',
    reference: 'DEC-UE-2023-001',
    tranche: 'Tranche 1',
    montantPrevu: 1300000,
    montantRecu: 1300000,
    solde: 0,
    datePrevue: '2023-12-01',
    dateReception: '2023-11-28',
    statut: 'Reçu',
    devise: 'EUR',
  },
  {
    id: 'd9',
    bailleur: 'Union Européenne',
    convention: 'UE-FED11-NIG-2023-047',
    reference: 'DEC-UE-2025-002',
    tranche: 'Tranche 2',
    montantPrevu: 1300000,
    montantRecu: 0,
    solde: 1300000,
    datePrevue: '2025-09-01',
    dateReception: null,
    statut: 'En attente',
    devise: 'EUR',
  },
  {
    id: 'd10',
    bailleur: 'République du Niger',
    convention: 'GVT-NIG-2023-CP-014',
    reference: 'DEC-GVT-2023-001',
    tranche: 'Contrepartie T1',
    montantPrevu: 295000000,
    montantRecu: 177000000,
    solde: 118000000,
    datePrevue: '2023-03-31',
    dateReception: '2023-03-31',
    statut: 'Reçu',
    devise: 'XOF',
  },
];

// ==========================================
// MOCK: KPIs
// ==========================================

export const mockDisbursementKPIs: DisbursementKPIs = {
  montantTotalPrevu: '30.96M USD éq.',
  montantTotalRecu: '21.96M USD éq.',
  tauxDecaissement: 65,
  nombreRecu: 6,
  nombreEnAttente: 2,
  nombreEnRetard: 1,
};

// ==========================================
// MOCK: ÉVOLUTION MENSUELLE (12 mois)
// ==========================================

export const mockDisbursementChart: DisbursementChartPoint[] = [
  { mois: 'Jan', prevu: 2.1, recu: 1.8 },
  { mois: 'Fév', prevu: 1.5, recu: 1.5 },
  { mois: 'Mar', prevu: 3.2, recu: 2.9 },
  { mois: 'Avr', prevu: 5.5, recu: 5.5 },
  { mois: 'Mai', prevu: 1.9, recu: 1.4 },
  { mois: 'Juin', prevu: 4.6, recu: 4.6 },
  { mois: 'Juil', prevu: 3.1, recu: 2.7 },
  { mois: 'Août', prevu: 1.8, recu: 1.1 },
  { mois: 'Sep', prevu: 2.4, recu: 1.6 },
  { mois: 'Oct', prevu: 3.0, recu: 1.8 },
  { mois: 'Nov', prevu: 2.6, recu: 0.9 },
  { mois: 'Déc', prevu: 3.5, recu: 0.0 },
];
