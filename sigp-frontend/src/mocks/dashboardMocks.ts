import { 
  EvmDataPoint, TimeSeriesDataPoint, DistributionDataPoint, 
  CriticalActivity, MainRisk, Milestone, ProjectEvent 
} from '../types/dashboard';

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
// MOCK: DISBURSEMENTS & MONTHLY BUDGET
// ==========================================
export const mockDisbursements: TimeSeriesDataPoint[] = [
  { label: 'Jan', value: 20 },
  { label: 'Fév', value: 35 },
  { label: 'Mar', value: 60 },
  { label: 'Avr', value: 45 },
  { label: 'Mai', value: 80 },
  { label: 'Juin', value: 110 },
];

// ==========================================
// MOCK: BUDGET DISTRIBUTION
// ==========================================
export const mockBudgetDistribution: DistributionDataPoint[] = [
  { label: 'Composante 1: Infrastructures', value: 12300000, percentage: 50, color: 'var(--navy-500)' },
  { label: 'Composante 2: Équipements', value: 7380000, percentage: 30, color: 'var(--green)' },
  { label: 'Gestion du projet', value: 4920000, percentage: 20, color: 'var(--amber)' },
];

export const mockFundingDistribution: DistributionDataPoint[] = [
  { label: 'AFD (Prêt)', value: 18450000, percentage: 75, color: 'var(--navy-700)' },
  { label: 'État du Niger', value: 6150000, percentage: 25, color: 'var(--slate)' },
];

// ==========================================
// MOCK: ACTIVITIES & RISKS
// ==========================================
export const mockCriticalActivities: CriticalActivity[] = [
  { id: '1', code: 'A1.2', name: "Étude d'impact environnemental", delayDays: 45, status: 'blocked' },
  { id: '2', code: 'C3.1', name: "Passation marché solaire", delayDays: 12, status: 'delayed' },
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
  { id: 'm1', date: '2024-02-15', title: 'Réception poteaux phase 1', status: 'pending' },
  { id: 'm2', date: '2024-03-02', title: 'Audit financier intermédiaire', status: 'pending' },
];

export const mockEvents: ProjectEvent[] = [
  { id: 'e1', date: 'Aujourd\'hui', type: 'alert', description: 'Risque de change passé en statut Critique.' },
  { id: 'e2', date: 'Hier', type: 'validation', description: 'Le TDR pour le marché solaire a été validé par l\'AFD.' },
  { id: 'e3', date: 'Il y a 3 jours', type: 'payment', description: 'Décaissement de 1.2M$ reçu sur le compte spécial.' },
];
