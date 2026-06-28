// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | 'En bonne voie'
  | 'À risque'
  | 'En retard'
  | 'Clôturé'
  | 'En préparation';

export type ProjectSector =
  | 'Eau & Assainissement'
  | 'Agriculture'
  | 'Santé'
  | 'Éducation'
  | 'Infrastructure'
  | 'Énergie'
  | 'Gouvernance';

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  donor: string;
  sector: ProjectSector;
  country: string;
  manager: string;
  initialesManager: string;
  startDate: string;
  endDate: string;
  budgetTotal: number;
  devise: string;
  budgetDisplay: string;
  status: ProjectStatus;
  profileScore: number;
  progressScore: number;
  tauxDecaissement: number;
  composantes: number;
  activites: number;
  livrables: number;
}

export interface ProjectsKPIs {
  total: number;
  enBonneVoie: number;
  aRisque: number;
  enRetard: number;
  clotured: number;
  budgetPortefeuille: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — 12 projets de développement réalistes
// ─────────────────────────────────────────────────────────────────────────────

export const mockProjects: Project[] = [
  {
    id: '1',
    code: 'PROJ-001',
    name: 'Électrification Solaire Zones Rurales',
    description: "Déploiement de mini-réseaux solaires dans 48 communes rurales du Niger. Installation de 1 200 kits photovoltaïques et formation des techniciens locaux pour la maintenance.",
    donor: 'AFD',
    sector: 'Énergie',
    country: 'Niger',
    manager: 'Hassan Diallo',
    initialesManager: 'HD',
    startDate: '2023-01-15',
    endDate: '2026-12-31',
    budgetTotal: 24600000,
    devise: 'USD',
    budgetDisplay: '$24.6M',
    status: 'En retard',
    profileScore: 35,
    progressScore: 28,
    tauxDecaissement: 42,
    composantes: 4,
    activites: 18,
    livrables: 12,
  },
  {
    id: '2',
    code: 'PROJ-002',
    name: 'Accès Eau Potable et Assainissement Rural',
    description: "Amélioration de l'accès à l'eau potable et à l'assainissement dans les zones rurales du Mali. Construction de 120 forages, 45 adductions d'eau et 3 500 latrines.",
    donor: 'Banque Mondiale',
    sector: 'Eau & Assainissement',
    country: 'Mali',
    manager: 'Sarah Koné',
    initialesManager: 'SK',
    startDate: '2024-03-01',
    endDate: '2027-12-31',
    budgetTotal: 45200000,
    devise: 'USD',
    budgetDisplay: '$45.2M',
    status: 'En bonne voie',
    profileScore: 15,
    progressScore: 22,
    tauxDecaissement: 18,
    composantes: 5,
    activites: 24,
    livrables: 18,
  },
  {
    id: '3',
    code: 'PROJ-003',
    name: 'Santé Maternelle et Infantile',
    description: "Renforcement des capacités des structures sanitaires pour réduire la mortalité maternelle et infantile au Sénégal. Formation de 840 sages-femmes et équipement de 62 centres de santé.",
    donor: 'Union Européenne',
    sector: 'Santé',
    country: 'Sénégal',
    manager: 'Awa Diop',
    initialesManager: 'AD',
    startDate: '2021-01-01',
    endDate: '2024-12-31',
    budgetTotal: 18500000,
    devise: 'USD',
    budgetDisplay: '$18.5M',
    status: 'Clôturé',
    profileScore: 100,
    progressScore: 100,
    tauxDecaissement: 100,
    composantes: 3,
    activites: 14,
    livrables: 11,
  },
  {
    id: '4',
    code: 'PROJ-004',
    name: 'Appui à la Filière Agricole Nord',
    description: "Amélioration de la productivité agricole et des revenus des petits producteurs au Burkina Faso. Distribution de semences améliorées, formation aux bonnes pratiques agricoles et création de coopératives.",
    donor: 'USAID',
    sector: 'Agriculture',
    country: 'Burkina Faso',
    manager: 'Moussa Traoré',
    initialesManager: 'MT',
    startDate: '2022-06-01',
    endDate: '2025-06-30',
    budgetTotal: 12800000,
    devise: 'USD',
    budgetDisplay: '$12.8M',
    status: 'À risque',
    profileScore: 65,
    progressScore: 48,
    tauxDecaissement: 55,
    composantes: 3,
    activites: 12,
    livrables: 8,
  },
  {
    id: '5',
    code: 'PROJ-005',
    name: 'Gouvernance Locale et Décentralisation',
    description: "Renforcement des capacités des collectivités territoriales et amélioration de la participation citoyenne au Niger. Formation des élus locaux, systèmes de gestion budgétaire et plateformes de dialogue.",
    donor: 'PNUD',
    sector: 'Gouvernance',
    country: 'Niger',
    manager: 'Fatouma Issaka',
    initialesManager: 'FI',
    startDate: '2023-09-01',
    endDate: '2026-08-31',
    budgetTotal: 8400000,
    devise: 'USD',
    budgetDisplay: '$8.4M',
    status: 'En bonne voie',
    profileScore: 82,
    progressScore: 55,
    tauxDecaissement: 48,
    composantes: 4,
    activites: 16,
    livrables: 14,
  },
  {
    id: '6',
    code: 'PROJ-006',
    name: 'Réhabilitation Routes Rurales',
    description: "Réhabilitation et entretien de 480 km de routes rurales pour désenclaver les zones de production agricole en Côte d'Ivoire. Travaux à haute intensité de main-d'œuvre bénéficiant à 120 000 personnes.",
    donor: 'BAD',
    sector: 'Infrastructure',
    country: "Côte d'Ivoire",
    manager: 'Jean-Paul Konan',
    initialesManager: 'JK',
    startDate: '2022-03-01',
    endDate: '2025-09-30',
    budgetTotal: 32100000,
    devise: 'USD',
    budgetDisplay: '$32.1M',
    status: 'En retard',
    profileScore: 58,
    progressScore: 35,
    tauxDecaissement: 61,
    composantes: 3,
    activites: 10,
    livrables: 7,
  },
  {
    id: '7',
    code: 'PROJ-007',
    name: 'Formation Professionnelle et Emploi Jeunes',
    description: "Amélioration de l'employabilité des jeunes et des femmes au Mali par la formation professionnelle, l'apprentissage et l'insertion économique. 15 000 bénéficiaires sur 4 ans.",
    donor: 'AFD',
    sector: 'Éducation',
    country: 'Mali',
    manager: 'Aminata Coulibaly',
    initialesManager: 'AC',
    startDate: '2023-04-01',
    endDate: '2027-03-31',
    budgetTotal: 15600000,
    devise: 'USD',
    budgetDisplay: '$15.6M',
    status: 'En bonne voie',
    profileScore: 70,
    progressScore: 38,
    tauxDecaissement: 30,
    composantes: 4,
    activites: 20,
    livrables: 16,
  },
  {
    id: '8',
    code: 'PROJ-008',
    name: 'Résilience Climatique Sahel',
    description: "Renforcement de la résilience des communautés vulnérables face aux chocs climatiques au Burkina Faso. Agroforesterie, gestion durable des terres, stocks alimentaires communautaires.",
    donor: 'Union Européenne',
    sector: 'Agriculture',
    country: 'Burkina Faso',
    manager: 'Ibrahim Sankara',
    initialesManager: 'IS',
    startDate: '2024-01-01',
    endDate: '2027-12-31',
    budgetTotal: 28300000,
    devise: 'USD',
    budgetDisplay: '$28.3M',
    status: 'En bonne voie',
    profileScore: 20,
    progressScore: 15,
    tauxDecaissement: 12,
    composantes: 5,
    activites: 22,
    livrables: 15,
  },
  {
    id: '9',
    code: 'PROJ-009',
    name: 'Inclusion Financière Numérique',
    description: "Développement de l'inclusion financière par les services numériques au Sénégal. Plateforme mobile banking, formation des agents de proximité et réglementation fintech adaptée.",
    donor: 'Banque Mondiale',
    sector: 'Gouvernance',
    country: 'Sénégal',
    manager: 'Mamadou Ndiaye',
    initialesManager: 'MN',
    startDate: '2026-07-01',
    endDate: '2029-06-30',
    budgetTotal: 6200000,
    devise: 'USD',
    budgetDisplay: '$6.2M',
    status: 'En préparation',
    profileScore: 5,
    progressScore: 0,
    tauxDecaissement: 0,
    composantes: 3,
    activites: 9,
    livrables: 6,
  },
  {
    id: '10',
    code: 'PROJ-010',
    name: 'Santé Communautaire Élargie',
    description: "Extension du système de santé communautaire au Niger avec focus sur les maladies tropicales négligées, le paludisme et la malnutrition. 320 cases de santé équipées.",
    donor: 'OMS',
    sector: 'Santé',
    country: 'Niger',
    manager: 'Zeinabou Moussa',
    initialesManager: 'ZM',
    startDate: '2022-10-01',
    endDate: '2025-09-30',
    budgetTotal: 14700000,
    devise: 'USD',
    budgetDisplay: '$14.7M',
    status: 'À risque',
    profileScore: 72,
    progressScore: 55,
    tauxDecaissement: 63,
    composantes: 4,
    activites: 18,
    livrables: 13,
  },
  {
    id: '11',
    code: 'PROJ-011',
    name: 'Hydraulique Pastorale et Agropastorale',
    description: "Amélioration de l'accès à l'eau pour les pasteurs et agropasteurs du Mali. Construction de 85 mares pastorales, 42 puits pastorels et 18 systèmes d'adduction d'eau pour le bétail.",
    donor: 'BAD',
    sector: 'Eau & Assainissement',
    country: 'Mali',
    manager: 'Boubacar Keïta',
    initialesManager: 'BK',
    startDate: '2023-06-01',
    endDate: '2026-05-31',
    budgetTotal: 19500000,
    devise: 'USD',
    budgetDisplay: '$19.5M',
    status: 'En bonne voie',
    profileScore: 45,
    progressScore: 42,
    tauxDecaissement: 38,
    composantes: 3,
    activites: 14,
    livrables: 10,
  },
  {
    id: '12',
    code: 'PROJ-012',
    name: 'Éducation Pour Tous — Phase III',
    description: "Construction et équipement de 180 salles de classe, formation de 540 enseignants et amélioration de la qualité de l'enseignement primaire en Côte d'Ivoire.",
    donor: 'UNICEF',
    sector: 'Éducation',
    country: "Côte d'Ivoire",
    manager: 'Clémentine Yao',
    initialesManager: 'CY',
    startDate: '2022-09-01',
    endDate: '2025-08-31',
    budgetTotal: 22800000,
    devise: 'USD',
    budgetDisplay: '$22.8M',
    status: 'En retard',
    profileScore: 88,
    progressScore: 65,
    tauxDecaissement: 72,
    composantes: 3,
    activites: 12,
    livrables: 9,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────────────────────────────────────

export const mockProjectsKPIs: ProjectsKPIs = {
  total: 12,
  enBonneVoie: 5,
  aRisque: 2,
  enRetard: 3,
  clotured: 1,
  budgetPortefeuille: '$248.7M',
};

// ─────────────────────────────────────────────────────────────────────────────
// Filter option helpers
// ─────────────────────────────────────────────────────────────────────────────

export function uniqueOptions(
  projects: Project[],
  key: keyof Project,
): { label: string; value: string }[] {
  const values = [...new Set(projects.map((p) => String(p[key])))].sort();
  return values.map((v) => ({ label: v, value: v }));
}
