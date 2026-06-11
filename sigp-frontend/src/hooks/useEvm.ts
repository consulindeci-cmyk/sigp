import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { EvmIndicateurs, EvmTache } from '@/types'

// Indicateurs EVM globaux d'un projet
export function useEvm(projectId: string, dateControle?: string) {
  return useQuery({
    queryKey: ['evm', projectId, dateControle],
    queryFn: async () => {
      const params = dateControle ? { dateControle } : {}
      const { data } = await api.get<EvmIndicateurs>(`/projects/${projectId}/evm`, { params })
      return data
    },
    enabled: !!projectId,
    staleTime: 1000 * 30, // 30s — EVM se recalcule fréquemment
  })
}

// EVM détaillé par tâche
export function useEvmTasks(projectId: string, dateControle?: string) {
  return useQuery({
    queryKey: ['evm-tasks', projectId, dateControle],
    queryFn: async () => {
      const params = dateControle ? { dateControle } : {}
      const { data } = await api.get<EvmTache[]>(`/projects/${projectId}/evm/tasks`, { params })
      return data
    },
    enabled: !!projectId,
    staleTime: 1000 * 30,
  })
}

// Tendance mensuelle EVM (courbe en S)
export function useEvmTrend(projectId: string) {
  return useQuery({
    queryKey: ['evm-trend', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/evm/trend`)
      return data as { projet_id: string; evolution_mensuelle: Array<{ mois: string; pv: number; ev: number; ac: number }> }
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5min
  })
}
