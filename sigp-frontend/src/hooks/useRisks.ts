import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Risque, PaginatedResponse } from '@/types'

export function useRisks(projectId: string) {
  return useQuery({
    queryKey: ['risks', projectId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Risque>>(`/projects/${projectId}/risks`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useRiskMatrix(projectId: string) {
  return useQuery({
    queryKey: ['risks-matrix', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/risks/matrix`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateRisk(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Risque>) => {
      const { data } = await api.post<Risque>(`/projects/${projectId}/risks`, dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks', projectId] }),
  })
}

export function useUpdateRisk(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Risque> & { id: string }) => {
      const { data } = await api.patch<Risque>(`/projects/${projectId}/risks/${id}`, dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks', projectId] }),
  })
}

export function useDeleteRisk(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (riskId: string) => {
      await api.delete(`/projects/${projectId}/risks/${riskId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks', projectId] }),
  })
}
