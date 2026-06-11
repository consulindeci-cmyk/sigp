import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Marche, PaginatedResponse } from '@/types'

export function usePPM(projectId: string) {
  return useQuery({
    queryKey: ['ppm', projectId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Marche>>(`/projects/${projectId}/marches`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateMarche(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Marche>) => {
      const { data } = await api.post<Marche>(`/projects/${projectId}/marches`, dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ppm', projectId] }),
  })
}

export function useUpdateMarche(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Marche> & { id: string }) => {
      const { data } = await api.patch<Marche>(`/projects/${projectId}/marches/${id}`, dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ppm', projectId] }),
  })
}

export function useDeleteMarche(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${projectId}/marches/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ppm', projectId] }),
  })
}
