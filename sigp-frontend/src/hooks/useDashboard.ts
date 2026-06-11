import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard-global'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/global')
      return data
    },
    staleTime: 1000 * 60, // 1 min
  })
}

export function useProjectSummary(projectId: string) {
  return useQuery({
    queryKey: ['project-summary', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/summary`)
      return data as {
        projet_id: string; code_projet: string; nom_projet: string;
        budget_total: number; montant_engage: number; montant_decaisse: number;
        solde_disponible: number; taux_consommation_pct: number;
      }
    },
    enabled: !!projectId,
  })
}

export function useBudget(projectId: string) {
  return useQuery({
    queryKey: ['budget', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/budget`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useWBS(projectId: string) {
  return useQuery({
    queryKey: ['wbs', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/wbs`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useLogframe(projectId: string) {
  return useQuery({
    queryKey: ['logframe', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/logframe`)
      return data
    },
    enabled: !!projectId,
  })
}

export function usePTBA(projectId: string) {
  return useQuery({
    queryKey: ['ptba', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/ptba`)
      return data
    },
    enabled: !!projectId,
  })
}
