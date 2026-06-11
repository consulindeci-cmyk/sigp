import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Projet, PaginatedResponse } from '@/types'

export const projectKeys = {
  all: ['projects'] as const,
  list: (params?: object) => [...projectKeys.all, 'list', params] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  summary: (id: string) => [...projectKeys.all, 'summary', id] as const,
}

// Liste des projets
export function useProjects(params?: {
  page?: number; limit?: number; search?: string; statut?: string
}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Projet>>('/projects', { params })
      return data
    },
  })
}

// Détail d'un projet
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Projet>(`/projects/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// Résumé financier
export function useProjectSummary(id: string) {
  return useQuery({
    queryKey: projectKeys.summary(id),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}/summary`)
      return data
    },
    enabled: !!id,
  })
}

// Créer un projet
export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Projet>) => {
      const { data } = await api.post<Projet>('/projects', dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

// Mettre à jour un projet
export function useUpdateProject(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Projet>) => {
      const { data } = await api.patch<Projet>(`/projects/${id}`, dto)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(id) })
      qc.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

// Supprimer un projet
export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`)
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}
