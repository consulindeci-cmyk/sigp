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
