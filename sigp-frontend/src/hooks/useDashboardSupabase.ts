// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Dashboard via Supabase (dernier module de la séquence).
// Lecture seule : une unique Edge Function `dashboard-summary` fait toute
// l'agrégation, RLS-scopée via le JWT de l'appelant (pas de service_role).
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery } from '@tanstack/react-query'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const dashboardSupabaseKeys = {
  all: ['dashboard-supabase'] as const,
}

export interface DashboardSupabaseResponse {
  projets: { total: number; actifs: number; termines: number; suspendus: number; pctActifs: number; pctTermines: number }
  finances: {
    budgetTotal: number; montantEngage: number; montantPaye: number; montantRestant: number
    nombreVersions: number; nombreLignes: number; tauxDecaissement: string
    percentEngaged: number; percentDisbursed: number; nombreBailleurs: number
  }
  risques: { total: number; critiques: number; eleves: number }
  passation: { marchesTotal: number; marchesTermines: number; marchesEnCours: number; etapesTotal: number }
  overview: {
    ptbaTotal: number; ptbaTermines: number; ptbaEnCours: number; ptbaNonDemarres: number
    livrablesTotal: number; livrablesValides: number; livrablesSoumis: number
    documentsTotal: number; rapportsTotal: number; notificationsTotal: number; notificationsNonLues: number
  }
  evmData: Array<{ date: string; pv: number; ev: number; ac: number }>
  decaissementsMensuels: Array<{ label: string; value: number }>
  budgetDistribution: Array<{ label: string; value: number; percent: number; color: string }>
  financementDistribution: Array<{ label: string; value: number; percent: number; color: string }>
  activitesCritiques: Array<{ id: string; code: string; name: string; status: string; delayDays: number }>
  risquesPrincipaux: Array<{ id: string; description: string; probability: number; level: string }>
  risquesParCategorie: Array<{ label: string; value: number; percent: number; color: string }>
  jalons: Array<{ id: string; title: string; date: string; status: string }>
  evenementsRecents: Array<{ id: string; description: string; date: string; type: string }>
  activitesRecentes: Array<{ id: string; title: string; meta: string; time: string; colorClass: string }>
  echeancesProches: Array<{ id: string; title: string; meta: string; time: string; colorClass: string }>
  timeline: Array<{ id: string; title: string; date: string; project: string; type: string }>
  generatedAt: string
}

export function useDashboardSupabase() {
  return useQuery({
    queryKey: dashboardSupabaseKeys.all,
    queryFn: () => invokeEdgeFunction<DashboardSupabaseResponse>('dashboard-summary', {}),
  })
}
