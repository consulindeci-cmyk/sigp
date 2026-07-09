import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard-global'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard')
      // Backend envelope: { success, data: {...}, timestamp } — unwrap inner payload
      return (data?.data ?? data) as Record<string, unknown>
    },
    staleTime: 1000 * 60, // 1 min
  })
}

