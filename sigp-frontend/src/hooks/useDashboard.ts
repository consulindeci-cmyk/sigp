import { useQuery } from '@tanstack/react-query'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

// Exportée pour que les mutations d'autres modules (décaissements, PTBA,
// risques, budget...) puissent invalider ce cache après une saisie — sans
// ça, le Tableau de Bord Portefeuille peut rester périmé jusqu'à 5 min
// (staleTime) après une modification, cf. audit Tableau de Bord.
export const dashboardKeys = {
  global: () => ['dashboard-global'] as const,
}

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.global(),
    queryFn: () => invokeEdgeFunction<Record<string, unknown>>('dashboard-summary', {}),
    staleTime: 1000 * 60 * 5, // 5 min
    refetchOnWindowFocus: false,
  })
}
