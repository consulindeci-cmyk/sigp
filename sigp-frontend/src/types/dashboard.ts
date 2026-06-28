/**
 * dashboard.ts
 * Définit les contrats de données (Interfaces) pour le Cockpit (Aperçu)
 * Prépare le terrain pour les futures API Backend.
 */

// ==========================================
// WIDGET PROPS & STATE
// ==========================================
export type WidgetState = 'loading' | 'empty' | 'error' | 'success';

export interface BaseWidgetProps<T> {
  data?: T;
  state?: WidgetState;
  title: string;
  errorMsg?: string;
  className?: string;
  style?: React.CSSProperties;
}

// ==========================================
// 1. EVM CHART
// ==========================================
/**
 * API Attendue : GET /api/projects/:id/evm-curve
 * Renvoie l'historique et les projections EVM pour tracer la courbe en S.
 */
export interface EvmDataPoint {
  date: string;
  pv: number; // Planned Value
  ev: number; // Earned Value
  ac: number; // Actual Cost
}

// ==========================================
// 2. DISBURSEMENT CHART & MONTHLY BUDGET
// ==========================================
/**
 * API Attendue : GET /api/projects/:id/disbursements/evolution
 */
export interface TimeSeriesDataPoint {
  label: string; // ex: 'Jan', 'Fév'
  value: number;
}

// ==========================================
// 3. BUDGET DISTRIBUTION (Par Composante)
// ==========================================
/**
 * API Attendue : GET /api/projects/:id/budget/components
 */
export interface DistributionDataPoint {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

// ==========================================
// 4. CRITICAL ACTIVITIES
// ==========================================
/**
 * API Attendue : GET /api/projects/:id/activities/critical
 */
export interface CriticalActivity {
  id: string;
  code: string;
  name: string;
  delayDays: number;
  status: 'delayed' | 'blocked';
}

// ==========================================
// 5. MAIN RISKS
// ==========================================
/**
 * API Attendue : GET /api/projects/:id/risks/top
 */
export interface MainRisk {
  id: string;
  description: string;
  level: 'high' | 'medium' | 'low';
  probability: number; // 0-100
}

// ==========================================
// 6. MILESTONES
// ==========================================
/**
 * API Attendue : GET /api/projects/:id/milestones/upcoming
 */
export interface Milestone {
  id: string;
  date: string;
  title: string;
  status: 'pending' | 'achieved' | 'delayed';
}

// ==========================================
// 7. EVENTS CHRONOLOGY
// ==========================================
/**
 * API Attendue : GET /api/projects/:id/events
 */
export interface ProjectEvent {
  id: string;
  date: string;
  type: 'validation' | 'payment' | 'alert' | 'milestone';
  description: string;
}

// ==========================================
// 8. PORTFOLIO KPIs
// ==========================================
export interface PortfolioKPI {
  totalProjets: number;
  projetsActifs: number;
  projetsTermines: number;
  projetsEnRetard: number;
  budgetGlobal: string;
  budgetDecaisse: string;
  tauxDecaissement: string;
  contratsActifs: number;
  contratsEnApprobation: number;
  risquesCritiques: number;
  risquesCritiquesProgram: string;
  nombreBailleurs: number;
}

// ==========================================
// 9. BUDGET BREAKDOWN BY BAILLEUR
// ==========================================
export type DashboardProgressColor = 'default' | 'primary' | 'success' | 'warning' | 'destructive';

export interface BudgetBailleur {
  label: string;
  value: string;
  percent: number;
  color: DashboardProgressColor;
}

// ==========================================
// 10. RISK BREAKDOWN BY CATEGORY
// ==========================================
export interface RiskCategory {
  label: string;
  value: number;
  percent: number;
  color: DashboardProgressColor;
}

// ==========================================
// 11. RECENT ACTIVITIES
// ==========================================
export interface RecentActivity {
  id: string;
  title: string;
  meta: string;
  time: string;
  colorClass: string;
}

// ==========================================
// 12. UPCOMING DEADLINES
// ==========================================
export interface UpcomingDeadline {
  id: string;
  title: string;
  meta: string;
  time: string;
  colorClass: string;
}

// ==========================================
// 13. ALERTS
// ==========================================
export interface DashboardAlert {
  id: string;
  title: string;
  meta: string;
  type: 'critical' | 'warning';
}

// ==========================================
// 14. PROJECT STATUS DISTRIBUTION
// ==========================================
export interface ProjectStatusItem {
  name: string;
  value: number;
  color: string;
}

// ==========================================
// 15. BUDGET CONSUMPTION
// ==========================================
export interface BudgetConsumptionData {
  total: number;
  engaged: number;
  disbursed: number;
  remaining: number;
  percentDisbursed: number;
  percentEngaged: number;
}

// ==========================================
// 16. TIMELINE
// ==========================================
export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  project: string;
  type: 'milestone' | 'deadline' | 'event';
}
