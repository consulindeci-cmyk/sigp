import {
  EvmDataPoint, TimeSeriesDataPoint, DistributionDataPoint,
  CriticalActivity, MainRisk, Milestone, ProjectEvent,
  PortfolioKPI, BudgetBailleur, RiskCategory, RecentActivity,
  UpcomingDeadline, DashboardAlert, ProjectStatusItem,
  BudgetConsumptionData, TimelineItem,
} from '../types/dashboard';

// ==========================================
// MOCK: PORTFOLIO KPIs
// ==========================================
export const mockPortfolioKPIs: PortfolioKPI = {
  totalProjets: 42,
  projetsActifs: 31,
  projetsTermines: 7,
  projetsEnRetard: 4,
  budgetGlobal: '$284.6M',
  budgetDecaisse: '$176.2M',
  tauxDecaissement: '61.9%',
  contratsActifs: 118,
  contratsEnApprobation: 23,
  risquesCritiques: 9,
  risquesCritiquesProgram: '6 projets',
  nombreBailleurs: 9,
};

// ==========================================
// MOCK: EVM CURVE
// ==========================================
export const mockEvmData: EvmDataPoint[] = [
  { date: '2023-Q1', pv: 500, ev: 450, ac: 480 },
  { date: '2023-Q2', pv: 1200, ev: 1000, ac: 1100 },
  { date: '2023-Q3', pv: 2000, ev: 1800, ac: 1950 },
  { date: '2023-Q4', pv: 3500, ev: 3000, ac: 3400 },
  { date: '2024-Q1', pv: 5000, ev: 4200, ac: 5100 },
  { date: '2024-Q2', pv: 7000, ev: 6100, ac: 7200 },
  { date: '2024-Q3', pv: 9500, ev: 8000, ac: 9800 },
];

// ==========================================
// MOCK: DISBURSEMENTS — 12 MONTHS
// ==========================================
export const mockDisbursements: TimeSeriesDataPoint[] = [
  { label: 'Jan', value: 20 },
  { label: 'Fév', value: 35 },
  { label: 'Mar', value: 60 },
  { label: 'Avr', value: 45 },
  { label: 'Mai', value: 80 },
  { label: 'Juin', value: 110 },
];

export const mockDisbursements12Months: TimeSeriesDataPoint[] = [
  { label: 'Juil', value: 8.2 },
  { label: 'Août', value: 6.5 },
  { label: 'Sep', value: 12.1 },
  { label: 'Oct', value: 9.8 },
  { label: 'Nov', value: 14.3 },
  { label: 'Déc', value: 18.7 },
  { label: 'Jan', value: 11.4 },
  { label: 'Fév', value: 15.8 },
  { label: 'Mar', value: 22.6 },
  { label: 'Avr', value: 19.4 },
  { label: 'Mai', value: 27.1 },
  { label: 'Juin', value: 30.5 },
];

// ==========================================
// MOCK: BUDGET DISTRIBUTION (By Component)
// ==========================================
export const mockBudgetDistribution: DistributionDataPoint[] = [
  { label: 'Infrastructures', value: 12300000, percentage: 50, color: 'var(--navy-500)' },
  { label: 'Équipements', value: 7380000, percentage: 30, color: 'var(--green)' },
  { label: 'Gestion du projet', value: 4920000, percentage: 20, color: 'var(--amber)' },
];

// ==========================================
// MOCK: FUNDING DISTRIBUTION
// ==========================================
export const mockFundingDistribution: DistributionDataPoint[] = [
  { label: 'AFD (Prêt)', value: 18450000, percentage: 75, color: 'var(--navy-700)' },
  { label: 'État du Niger', value: 6150000, percentage: 25, color: 'var(--slate)' },
];

// ==========================================
// MOCK: BUDGET BY BAILLEUR
// ==========================================
export const mockBudgetByBailleur: BudgetBailleur[] = [
  { label: 'Banque Mondiale', value: '$96.4M', percent: 80, color: 'primary' },
  { label: 'Union Européenne', value: '$71.2M', percent: 60, color: 'primary' },
  { label: 'USAID', value: '$48.9M', percent: 40, color: 'primary' },
  { label: 'AFD', value: '$33.6M', percent: 30, color: 'primary' },
  { label: 'PNUD', value: '$21.1M', percent: 20, color: 'primary' },
  { label: 'Autres bailleurs', value: '$13.4M', percent: 15, color: 'default' },
];

// ==========================================
// MOCK: RISKS BY CATEGORY
// ==========================================
export const mockRisksByCategory: RiskCategory[] = [
  { label: 'Financiers', value: 14, percent: 70, color: 'destructive' },
  { label: 'Opérationnels', value: 11, percent: 55, color: 'warning' },
  { label: 'Passation des marchés', value: 9, percent: 45, color: 'primary' },
  { label: 'Environnementaux & Sociaux', value: 6, percent: 30, color: 'success' },
  { label: 'Politiques / Gouvernance', value: 5, percent: 25, color: 'default' },
];

// ==========================================
// MOCK: PROJECT STATUS DISTRIBUTION
// ==========================================
export const mockProjectStatusDistribution: ProjectStatusItem[] = [
  { name: 'Actifs', value: 31, color: 'var(--success, #22c55e)' },
  { name: 'Terminés', value: 7, color: 'var(--muted-foreground, #94a3b8)' },
  { name: 'En retard', value: 4, color: 'var(--destructive, #ef4444)' },
];

// ==========================================
// MOCK: BUDGET CONSUMPTION
// ==========================================
export const mockBudgetConsumption: BudgetConsumptionData = {
  total: 284.6,
  engaged: 220.3,
  disbursed: 176.2,
  remaining: 64.3,
  percentDisbursed: 61.9,
  percentEngaged: 77.4,
};

// ==========================================
// MOCK: ACTIVITIES & RISKS
// ==========================================
export const mockCriticalActivities: CriticalActivity[] = [
  { id: '1', code: 'A1.2', name: "Étude d'impact environnemental", delayDays: 45, status: 'blocked' },
  { id: '2', code: 'C3.1', name: 'Passation marché solaire', delayDays: 12, status: 'delayed' },
  { id: '3', code: 'B2.4', name: 'Formation équipes terrain', delayDays: 8, status: 'delayed' },
];

export const mockMainRisks: MainRisk[] = [
  { id: 'r1', description: 'Fluctuation taux de change EUR/XOF', level: 'high', probability: 85 },
  { id: 'r2', description: 'Blocage douanier équipements', level: 'high', probability: 70 },
  { id: 'r3', description: 'Retard déblocage fonds État', level: 'medium', probability: 50 },
];

// ==========================================
// MOCK: MILESTONES & EVENTS
// ==========================================
export const mockMilestones: Milestone[] = [
  { id: 'm1', date: '2026-07-15', title: 'Réception matériel phase 2', status: 'pending' },
  { id: 'm2', date: '2026-08-02', title: 'Audit financier intermédiaire', status: 'pending' },
  { id: 'm3', date: '2026-09-10', title: 'Revue à mi-parcours AFD', status: 'pending' },
];

export const mockEvents: ProjectEvent[] = [
  { id: 'e1', date: "Aujourd'hui", type: 'alert', description: 'Risque de change passé en statut Critique — PROJ-014.' },
  { id: 'e2', date: 'Hier', type: 'validation', description: "Le TDR pour le marché solaire a été validé par l'AFD." },
  { id: 'e3', date: 'Il y a 3 jours', type: 'payment', description: 'Décaissement de 1.2M$ reçu sur le compte spécial — PROJ-009.' },
  { id: 'e4', date: 'Il y a 5 jours', type: 'milestone', description: 'Jalons phase 1 atteints — PROJ-003 Chaînes de Valeur Agricoles.' },
];

// ==========================================
// MOCK: RECENT ACTIVITIES
// ==========================================
export const mockRecentActivities: RecentActivity[] = [
  { id: 'a1', title: 'PTBA T2 2026 validé', meta: 'PROJ-014 - Électrification Rurale Phase II', time: 'Il y a 2h', colorClass: 'bg-success' },
  { id: 'a2', title: 'Contrat signé — Travaux publics lot 3', meta: 'PROJ-009 - Approvisionnement en Eau Urbaine', time: 'Il y a 5h', colorClass: 'bg-primary' },
  { id: 'a3', title: 'Révision budgétaire soumise au bailleur', meta: 'PROJ-021 - Renforcement des Systèmes de Santé', time: 'Il y a 1j', colorClass: 'bg-warning' },
  { id: 'a4', title: 'Nouveau risque : exposition aux devises', meta: 'PROJ-014 - Électrification Rurale Phase II', time: 'Il y a 1j', colorClass: 'bg-primary' },
  { id: 'a5', title: 'Rapport trimestriel bailleur exporté (PDF)', meta: 'PROJ-003 - Chaînes de Valeur Agricoles', time: 'Il y a 2j', colorClass: 'bg-success' },
];

// ==========================================
// MOCK: UPCOMING DEADLINES
// ==========================================
export const mockUpcomingDeadlines: UpcomingDeadline[] = [
  { id: 'd1', title: "Ouverture des offres — Mini-réseaux solaires lot 1", meta: 'PROJ-014', time: 'Demain', colorClass: 'bg-destructive' },
  { id: 'd2', title: 'Rapport financier T2 dû à la délégation UE', meta: 'PROJ-021', time: 'Dans 3 jours', colorClass: 'bg-warning' },
  { id: 'd3', title: 'Début de la mission de revue à mi-parcours', meta: 'PROJ-009', time: 'Dans 6 jours', colorClass: 'bg-primary' },
  { id: 'd4', title: 'Audit annuel — Début des travaux terrain', meta: 'PROJ-003', time: 'Dans 11 jours', colorClass: 'bg-muted-foreground' },
  { id: 'd5', title: 'Atelier de préparation PTBA 2027', meta: 'Tout le portefeuille', time: 'Dans 18 jours', colorClass: 'bg-muted-foreground' },
];

// ==========================================
// MOCK: ALERTS
// ==========================================
export const mockAlerts: DashboardAlert[] = [
  { id: 'al1', title: 'IPC sous le seuil (0.84) — Approvisionnement en Eau Urbaine', meta: 'Dépassement des coûts en hausse sur 3 mois consécutifs', type: 'critical' },
  { id: 'al2', title: 'IPD sous le seuil (0.79) — Électrification Rurale Phase II', meta: 'Retard de calendrier sur les activités du chemin critique', type: 'critical' },
  { id: 'al3', title: '3 contrats en attente d\'approbation > 14 jours', meta: 'Goulot d\'étranglement dans le flux d\'approbation', type: 'warning' },
  { id: 'al4', title: 'Taux de décaissement sous la cible annuelle', meta: 'Renforcement des Systèmes de Santé — 41% décaissé à la mi-année', type: 'warning' },
];

// ==========================================
// MOCK: TIMELINE
// ==========================================
export const mockTimelineItems: TimelineItem[] = [
  { id: 't1', date: 'Juil. 2026', title: 'Rapport T2 Banque Mondiale', project: 'PROJ-014', type: 'deadline' },
  { id: 't2', date: 'Août 2026', title: 'Revue mi-parcours AFD', project: 'PROJ-009', type: 'milestone' },
  { id: 't3', date: 'Sep. 2026', title: 'Début Travaux Phase 3', project: 'PROJ-021', type: 'milestone' },
  { id: 't4', date: 'Oct. 2026', title: 'Audit annuel USAID', project: 'PROJ-003', type: 'deadline' },
  { id: 't5', date: 'Nov. 2026', title: 'PTBA 2027 — Soumission', project: 'Portefeuille', type: 'event' },
];
