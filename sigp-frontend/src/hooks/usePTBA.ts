import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { PTBA, PaginatedResponse } from '@/types'

export function usePTBA(projectId: string) {
  return useQuery({
    queryKey: ['ptba', projectId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<PTBA>>(`/projects/${projectId}/ptba`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreatePTBA(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<PTBA>) => {
      const { data } = await api.post<PTBA>(`/projects/${projectId}/ptba`, dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ptba', projectId] }),
  })
}

export function useUpdatePTBA(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<PTBA> & { id: string }) => {
      const { data } = await api.patch<PTBA>(`/projects/${projectId}/ptba/${id}`, dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ptba', projectId] }),
  })
}

export function useDeletePTBA(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${projectId}/ptba/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ptba', projectId] }),
  })
}
