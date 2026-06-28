// ==========================================
// TYPES
// ==========================================

export type DeliverableStatus = 'Validé' | 'En cours' | 'Non démarré' | 'En retard' | 'Abandonné';
export type DeliverablePriority = 'Critique' | 'Haute' | 'Moyenne' | 'Faible';
export type DeliverableCategory =
  | 'Infrastructure'
  | 'Formation'
  | 'Rapport'
  | 'Étude'
  | 'Équipement'
  | 'Système';

export interface Deliverable {
  id: string;
  nom: string;
  responsable: string;
  initialesResponsable: string;
  datePrevue: string;
  dateReelle: string | null;
  avancement: number;
  statut: DeliverableStatus;
  priorite: DeliverablePriority;
  categorie: DeliverableCategory;
  description: string;
  composante: string;
}

export interface DeliverablesKPIs {
  total: number;
  valides: number;
  enCours: number;
  enRetard: number;
  tauxAvancement: number;
}

// ==========================================
// MOCK: LIVRABLES (12 entrées réalistes)
// ==========================================

export const mockDeliverables: Deliverable[] = [
  {
    id: 'liv1',
    nom: "Rapport d'étude d'impact environnemental et social",
    responsable: 'Aïchata Koné',
    initialesResponsable: 'AK',
    datePrevue: '2025-03-31',
    dateReelle: null,
    avancement: 45,
    statut: 'En retard',
    priorite: 'Critique',
    categorie: 'Étude',
    description: "Étude d'impact environnemental et social (EIES) conforme aux standards AFD et IDA.",
    composante: 'Composante A — Gestion Environnementale',
  },
  {
    id: 'liv2',
    nom: 'Formation équipes terrain — Protocoles phase 1',
    responsable: 'Rabiou Hamidou',
    initialesResponsable: 'RH',
    datePrevue: '2023-09-30',
    dateReelle: '2023-09-28',
    avancement: 100,
    statut: 'Validé',
    priorite: 'Haute',
    categorie: 'Formation',
    description: 'Formation de 42 agents de terrain sur les protocoles opérationnels phase 1.',
    composante: 'Composante B — Renforcement des Capacités',
  },
  {
    id: 'liv3',
    nom: "Construction point d'eau potable — Zone rurale A",
    responsable: 'Boubacar Issa',
    initialesResponsable: 'BI',
    datePrevue: '2025-08-31',
    dateReelle: null,
    avancement: 62,
    statut: 'En cours',
    priorite: 'Haute',
    categorie: 'Infrastructure',
    description: 'Forage et installation réseau de distribution eau potable, 3 villages.',
    composante: 'Composante C — Infrastructures Rurales',
  },
  {
    id: 'liv4',
    nom: 'Système de gestion des bénéficiaires (SGB)',
    responsable: 'Fatoumata Moussa',
    initialesResponsable: 'FM',
    datePrevue: '2025-09-30',
    dateReelle: null,
    avancement: 70,
    statut: 'En cours',
    priorite: 'Haute',
    categorie: 'Système',
    description: 'Plateforme numérique de suivi et gestion des bénéficiaires du projet.',
    composante: 'Composante D — Suivi & Évaluation',
  },
  {
    id: 'liv5',
    nom: 'Rapport trimestriel Q1 2025 — Bailleur AFD',
    responsable: 'Amadou Diallo',
    initialesResponsable: 'AD',
    datePrevue: '2025-04-15',
    dateReelle: '2025-04-12',
    avancement: 100,
    statut: 'Validé',
    priorite: 'Haute',
    categorie: 'Rapport',
    description: 'Rapport narratif et financier Q1 2025 transmis à la délégation AFD.',
    composante: 'Composante D — Suivi & Évaluation',
  },
  {
    id: 'liv6',
    nom: 'Acquisition et livraison équipements solaires lot 1',
    responsable: 'Salif Traoré',
    initialesResponsable: 'ST',
    datePrevue: '2024-06-30',
    dateReelle: '2024-07-05',
    avancement: 100,
    statut: 'Validé',
    priorite: 'Critique',
    categorie: 'Équipement',
    description: 'Livraison de 120 kits solaires pour mini-réseaux communautaires lot 1.',
    composante: 'Composante C — Infrastructures Rurales',
  },
  {
    id: 'liv7',
    nom: 'Rapport de revue à mi-parcours',
    responsable: 'Amadou Diallo',
    initialesResponsable: 'AD',
    datePrevue: '2026-08-31',
    dateReelle: null,
    avancement: 15,
    statut: 'En cours',
    priorite: 'Critique',
    categorie: 'Rapport',
    description: 'Revue à mi-parcours conjointe AFD / Banque Mondiale — évaluation des progrès.',
    composante: 'Composante D — Suivi & Évaluation',
  },
  {
    id: 'liv8',
    nom: 'Formation formateurs niveau 2 — Renforcement',
    responsable: 'Rabiou Hamidou',
    initialesResponsable: 'RH',
    datePrevue: '2026-09-30',
    dateReelle: null,
    avancement: 0,
    statut: 'Non démarré',
    priorite: 'Moyenne',
    categorie: 'Formation',
    description: 'Formation avancée de 15 formateurs locaux — transfert de compétences niveau 2.',
    composante: 'Composante B — Renforcement des Capacités',
  },
  {
    id: 'liv9',
    nom: 'Réhabilitation piste rurale — Commune B',
    responsable: 'Boubacar Issa',
    initialesResponsable: 'BI',
    datePrevue: '2025-11-30',
    dateReelle: null,
    avancement: 38,
    statut: 'En cours',
    priorite: 'Moyenne',
    categorie: 'Infrastructure',
    description: 'Réhabilitation de 12 km de piste rurale pour accès aux zones agricoles.',
    composante: 'Composante C — Infrastructures Rurales',
  },
  {
    id: 'liv10',
    nom: 'Audit financier intermédiaire 2025',
    responsable: 'Fatoumata Moussa',
    initialesResponsable: 'FM',
    datePrevue: '2025-12-15',
    dateReelle: null,
    avancement: 0,
    statut: 'Non démarré',
    priorite: 'Haute',
    categorie: 'Rapport',
    description: 'Audit financier indépendant des comptes du projet — exercice 2025.',
    composante: 'Composante D — Suivi & Évaluation',
  },
  {
    id: 'liv11',
    nom: 'Installation panneaux solaires communautaires lot 2',
    responsable: 'Salif Traoré',
    initialesResponsable: 'ST',
    datePrevue: '2025-06-30',
    dateReelle: null,
    avancement: 20,
    statut: 'En retard',
    priorite: 'Critique',
    categorie: 'Équipement',
    description: 'Installation de 80 panneaux solaires dans 5 villages — lot 2 du marché solaire.',
    composante: 'Composante C — Infrastructures Rurales',
  },
  {
    id: 'liv12',
    nom: "Manuel de procédures UFG — Version 2",
    responsable: 'Amadou Diallo',
    initialesResponsable: 'AD',
    datePrevue: '2024-03-31',
    dateReelle: '2024-03-29',
    avancement: 100,
    statut: 'Validé',
    priorite: 'Faible',
    categorie: 'Système',
    description: "Manuel de procédures administratives et financières de l'UFG mis à jour.",
    composante: 'Composante D — Suivi & Évaluation',
  },
];

// ==========================================
// MOCK: KPIs
// ==========================================

export const mockDeliverablesKPIs: DeliverablesKPIs = {
  total: 12,
  valides: 4,
  enCours: 4,
  enRetard: 2,
  tauxAvancement: 54,
};

// ==========================================
// MOCK: LIVRABLES RÉCENTS (pour la carte)
// ==========================================

export const mockRecentDeliverables: Deliverable[] = mockDeliverables
  .filter((d) => d.statut === 'Validé')
  .sort((a, b) => (b.dateReelle ?? '').localeCompare(a.dateReelle ?? ''))
  .slice(0, 3);

// ==========================================
// MOCK: PROCHAINS LIVRABLES (pour la timeline)
// ==========================================

export const mockUpcomingDeliverablesList: Deliverable[] = mockDeliverables
  .filter((d) => d.statut === 'Non démarré' || d.statut === 'En cours')
  .sort((a, b) => a.datePrevue.localeCompare(b.datePrevue))
  .slice(0, 6);
