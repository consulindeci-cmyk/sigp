export type ActivityStatus = 'Non démarré' | 'En cours' | 'Terminé' | 'En retard' | 'Suspendu';
export type ActivityPriority = 'Critique' | 'Haute' | 'Moyenne' | 'Faible';

export interface Activity {
  id: string;
  code: string;
  libelle: string;
  responsable: string;
  initialesResponsable: string;
  dateDebut: string;
  dateFin: string;
  avancement: number;
  priorite: ActivityPriority;
  statut: ActivityStatus;
  composante: string;
  description: string;
  budgetAlloue: number;
}

export interface ActivitiesKPIs {
  total: number;
  enCours: number;
  terminees: number;
  enRetard: number;
  tauxGlobal: number;
}

export const mockActivities: Activity[] = [
  {
    id: 'act1',
    code: 'ACT-A-001',
    libelle: "Réalisation de l'étude d'impact environnemental",
    responsable: 'Aïchata Koné',
    initialesResponsable: 'AK',
    dateDebut: '2023-02-01',
    dateFin: '2025-06-30',
    avancement: 65,
    priorite: 'Critique',
    statut: 'En cours',
    composante: 'Composante A — Gestion Environnementale',
    description: "Conduite de l'EIES et intégration des recommandations dans le plan de mise en œuvre.",
    budgetAlloue: 850000,
  },
  {
    id: 'act2',
    code: 'ACT-B-001',
    libelle: 'Formation initiale des agents communautaires',
    responsable: 'Rabiou Hamidou',
    initialesResponsable: 'RH',
    dateDebut: '2023-06-01',
    dateFin: '2023-09-30',
    avancement: 100,
    priorite: 'Haute',
    statut: 'Terminé',
    composante: 'Composante B — Renforcement des Capacités',
    description: 'Formation de 42 agents sur les protocoles opérationnels et outils numériques.',
    budgetAlloue: 245000,
  },
  {
    id: 'act3',
    code: 'ACT-C-001',
    libelle: "Construction de points d'eau — Lot 1",
    responsable: 'Boubacar Issa',
    initialesResponsable: 'BI',
    dateDebut: '2024-01-15',
    dateFin: '2025-08-31',
    avancement: 62,
    priorite: 'Haute',
    statut: 'En cours',
    composante: 'Composante C — Infrastructures Rurales',
    description: "Forage et réseaux de distribution d'eau potable — 3 villages zone A.",
    budgetAlloue: 1250000,
  },
  {
    id: 'act4',
    code: 'ACT-D-001',
    libelle: 'Développement du système SGB v1.0',
    responsable: 'Fatoumata Moussa',
    initialesResponsable: 'FM',
    dateDebut: '2024-03-01',
    dateFin: '2025-09-30',
    avancement: 70,
    priorite: 'Haute',
    statut: 'En cours',
    composante: 'Composante D — Suivi & Évaluation',
    description: 'Développement et déploiement de la plateforme de gestion des bénéficiaires.',
    budgetAlloue: 380000,
  },
  {
    id: 'act5',
    code: 'ACT-A-002',
    libelle: 'Mise en place du plan de gestion environnementale',
    responsable: 'Aïchata Koné',
    initialesResponsable: 'AK',
    dateDebut: '2023-04-01',
    dateFin: '2023-12-31',
    avancement: 100,
    priorite: 'Haute',
    statut: 'Terminé',
    composante: 'Composante A — Gestion Environnementale',
    description: 'Rédaction et validation du PGES par les bailleurs.',
    budgetAlloue: 125000,
  },
  {
    id: 'act6',
    code: 'ACT-C-002',
    libelle: 'Installation mini-réseaux solaires — Lot 1',
    responsable: 'Salif Traoré',
    initialesResponsable: 'ST',
    dateDebut: '2023-10-01',
    dateFin: '2024-06-30',
    avancement: 100,
    priorite: 'Critique',
    statut: 'Terminé',
    composante: 'Composante C — Infrastructures Rurales',
    description: 'Installation de 120 kits solaires pour alimentation communautés rurales.',
    budgetAlloue: 975000,
  },
  {
    id: 'act7',
    code: 'ACT-C-003',
    libelle: 'Installation mini-réseaux solaires — Lot 2',
    responsable: 'Salif Traoré',
    initialesResponsable: 'ST',
    dateDebut: '2024-07-01',
    dateFin: '2025-06-30',
    avancement: 20,
    priorite: 'Critique',
    statut: 'En retard',
    composante: 'Composante C — Infrastructures Rurales',
    description: "Installation de 80 kits solaires supplémentaires — zones difficiles d'accès.",
    budgetAlloue: 820000,
  },
  {
    id: 'act8',
    code: 'ACT-D-002',
    libelle: 'Revue à mi-parcours conjointe',
    responsable: 'Amadou Diallo',
    initialesResponsable: 'AD',
    dateDebut: '2026-06-01',
    dateFin: '2026-08-31',
    avancement: 0,
    priorite: 'Critique',
    statut: 'Non démarré',
    composante: 'Composante D — Suivi & Évaluation',
    description: 'Revue conjointe AFD/Banque Mondiale — évaluation mi-parcours.',
    budgetAlloue: 145000,
  },
  {
    id: 'act9',
    code: 'ACT-B-002',
    libelle: 'Formation formateurs niveau 2',
    responsable: 'Rabiou Hamidou',
    initialesResponsable: 'RH',
    dateDebut: '2026-01-15',
    dateFin: '2026-09-30',
    avancement: 0,
    priorite: 'Moyenne',
    statut: 'Non démarré',
    composante: 'Composante B — Renforcement des Capacités',
    description: 'Programme de formation avancée pour 15 formateurs locaux.',
    budgetAlloue: 190000,
  },
  {
    id: 'act10',
    code: 'ACT-C-004',
    libelle: 'Réhabilitation piste rurale — Commune B',
    responsable: 'Boubacar Issa',
    initialesResponsable: 'BI',
    dateDebut: '2024-09-01',
    dateFin: '2025-11-30',
    avancement: 38,
    priorite: 'Moyenne',
    statut: 'En cours',
    composante: 'Composante C — Infrastructures Rurales',
    description: 'Réhabilitation de 12 km de piste rurale pour accès zones agricoles.',
    budgetAlloue: 680000,
  },
  {
    id: 'act11',
    code: 'ACT-D-003',
    libelle: 'Audit financier annuel 2025',
    responsable: 'Fatoumata Moussa',
    initialesResponsable: 'FM',
    dateDebut: '2025-11-01',
    dateFin: '2025-12-15',
    avancement: 0,
    priorite: 'Haute',
    statut: 'Non démarré',
    composante: 'Composante D — Suivi & Évaluation',
    description: "Audit indépendant des comptes de l'exercice 2025.",
    budgetAlloue: 95000,
  },
  {
    id: 'act12',
    code: 'ACT-A-003',
    libelle: 'Suivi environnemental continu — Phase 2',
    responsable: 'Aïchata Koné',
    initialesResponsable: 'AK',
    dateDebut: '2024-01-01',
    dateFin: '2024-12-31',
    avancement: 45,
    priorite: 'Moyenne',
    statut: 'En retard',
    composante: 'Composante A — Gestion Environnementale',
    description: 'Surveillance environnementale trimestrielle et rapportage aux bailleurs.',
    budgetAlloue: 165000,
  },
];

export const mockActivitiesKPIs: ActivitiesKPIs = {
  total: 12,
  enCours: 4,
  terminees: 3,
  enRetard: 2,
  tauxGlobal: 42,
};
