export type HistoryModule =
  | 'Informations générales'
  | 'Budget'
  | 'Activités'
  | 'Gouvernance'
  | 'Livrables'
  | 'Risques'
  | 'Décaissements';

export interface HistoryEntry {
  id: string;
  version: string;
  date: string;
  auteur: string;
  initialesAuteur: string;
  module: HistoryModule;
  champ: string;
  modification: string;
  ancienneValeur: string;
  nouvelleValeur: string;
}

export const mockHistoryEntries: HistoryEntry[] = [
  {
    id: 'h1',
    version: 'v3.4',
    date: '2026-06-28',
    auteur: 'Amadou Diallo',
    initialesAuteur: 'AD',
    module: 'Budget',
    champ: 'Budget composante C',
    modification: 'Révision budgétaire suite avenant contractuel',
    ancienneValeur: '1 250 000 USD',
    nouvelleValeur: '1 380 000 USD',
  },
  {
    id: 'h2',
    version: 'v3.3',
    date: '2026-06-27',
    auteur: 'Fatoumata Moussa',
    initialesAuteur: 'FM',
    module: 'Livrables',
    champ: 'Statut livrable LIV-004',
    modification: 'Validation du SGB par le comité technique',
    ancienneValeur: 'En cours',
    nouvelleValeur: 'Validé',
  },
  {
    id: 'h3',
    version: 'v3.2',
    date: '2026-06-25',
    auteur: 'Rabiou Hamidou',
    initialesAuteur: 'RH',
    module: 'Activités',
    champ: 'Avancement ACT-B-001',
    modification: 'Clôture formation suite dernier atelier',
    ancienneValeur: '85%',
    nouvelleValeur: '100%',
  },
  {
    id: 'h4',
    version: 'v3.1',
    date: '2026-06-24',
    auteur: 'Aïchata Koné',
    initialesAuteur: 'AK',
    module: 'Risques',
    champ: 'Probabilité risque R-007',
    modification: 'Réévaluation suite retards constatés livraisons lot 2',
    ancienneValeur: 'Faible',
    nouvelleValeur: 'Élevée',
  },
  {
    id: 'h5',
    version: 'v3.0',
    date: '2026-06-22',
    auteur: 'Boubacar Issa',
    initialesAuteur: 'BI',
    module: 'Activités',
    champ: 'Date fin ACT-C-004',
    modification: 'Report pour conditions météorologiques défavorables',
    ancienneValeur: '30/09/2025',
    nouvelleValeur: '30/11/2025',
  },
  {
    id: 'h6',
    version: 'v2.9',
    date: '2026-06-20',
    auteur: 'Amadou Diallo',
    initialesAuteur: 'AD',
    module: 'Décaissements',
    champ: 'Statut décaissement DEC-BM-2025-003',
    modification: 'Mise à jour suite réception du virement BM',
    ancienneValeur: 'En retard',
    nouvelleValeur: 'Reçu',
  },
  {
    id: 'h7',
    version: 'v2.8',
    date: '2026-06-18',
    auteur: 'Fatoumata Moussa',
    initialesAuteur: 'FM',
    module: 'Gouvernance',
    champ: 'Membre équipe — Dr. Issoufou Maïga',
    modification: 'Recrutement expert technique spécialisé eau-assainissement',
    ancienneValeur: '—',
    nouvelleValeur: 'Expert Technique — Dr. Issoufou Maïga',
  },
  {
    id: 'h8',
    version: 'v2.7',
    date: '2026-06-15',
    auteur: 'Salif Traoré',
    initialesAuteur: 'ST',
    module: 'Activités',
    champ: 'Statut ACT-C-003',
    modification: 'Blocage constaté — retard fournisseur panneaux lot 2',
    ancienneValeur: 'En cours',
    nouvelleValeur: 'En retard',
  },
  {
    id: 'h9',
    version: 'v2.6',
    date: '2026-06-10',
    auteur: 'Amadou Diallo',
    initialesAuteur: 'AD',
    module: 'Informations générales',
    champ: 'Coordinateur projet',
    modification: 'Changement de coordinateur suite départ en retraite',
    ancienneValeur: 'Ibrahim Mahamadou',
    nouvelleValeur: 'Amadou Diallo',
  },
  {
    id: 'h10',
    version: 'v2.5',
    date: '2026-05-30',
    auteur: 'Aïchata Koné',
    initialesAuteur: 'AK',
    module: 'Budget',
    champ: 'Taux de change EUR/USD',
    modification: 'Actualisation taux conversion pour reporting Q2',
    ancienneValeur: '1 EUR = 1.08 USD',
    nouvelleValeur: '1 EUR = 1.12 USD',
  },
  {
    id: 'h11',
    version: 'v2.4',
    date: '2026-05-15',
    auteur: 'Rabiou Hamidou',
    initialesAuteur: 'RH',
    module: 'Livrables',
    champ: 'Responsable livrable LIV-007',
    modification: 'Transfert de responsabilité pour revue mi-parcours',
    ancienneValeur: 'Aïchata Koné',
    nouvelleValeur: 'Amadou Diallo',
  },
  {
    id: 'h12',
    version: 'v2.3',
    date: '2026-04-20',
    auteur: 'Boubacar Issa',
    initialesAuteur: 'BI',
    module: 'Informations générales',
    champ: 'Date fin projet',
    modification: "Extension de durée accordée par le comité de pilotage (avenant #3)",
    ancienneValeur: '31/12/2026',
    nouvelleValeur: '30/06/2027',
  },
];
