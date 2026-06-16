import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { LigneBudgetaireDetail, PaginatedResponse } from '@/types'

export function useBudget(projectId: string) {
  return useQuery({
    queryKey: ['budget', projectId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<LigneBudgetaireDetail>>(`/projects/${projectId}/budget`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateBudgetLine(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<LigneBudgetaireDetail>) => {
      const { data } = await api.post<LigneBudgetaireDetail>(`/projects/${projectId}/budget`, dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget', projectId] }),
  })
}

export function useUpdateBudgetLine(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<LigneBudgetaireDetail> & { id: string }) => {
      const { data } = await api.patch<LigneBudgetaireDetail>(`/projects/${projectId}/budget/${id}`, dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget', projectId] }),
  })
}

export function useDeleteBudgetLine(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${projectId}/budget/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget', projectId] }),
  })
}
