import { useQuery } from '@tanstack/react-query'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard-global'],
    queryFn: () => invokeEdgeFunction<Record<string, unknown>>('dashboard-summary', {}),
    staleTime: 1000 * 60, // 1 min
  })
}
