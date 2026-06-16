import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { CadreLogique, PaginatedResponse } from '@/types'

export function useLogframe(projectId: string) {
  return useQuery({
    queryKey: ['logframe', projectId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CadreLogique>>(`/projects/${projectId}/logframe`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateLogframe(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<CadreLogique>) => {
      const { data } = await api.post<CadreLogique>(`/projects/${projectId}/logframe`, dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logframe', projectId] }),
  })
}

export function useUpdateLogframe(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<CadreLogique> & { id: string }) => {
      const { data } = await api.patch<CadreLogique>(`/projects/${projectId}/logframe/${id}`, dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logframe', projectId] }),
  })
}

export function useDeleteLogframe(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${projectId}/logframe/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logframe', projectId] }),
  })
}
