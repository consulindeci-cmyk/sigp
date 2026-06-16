import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Tache, PaginatedResponse } from '@/types'

export const taskKeys = {
  all: (projectId: string) => ['tasks', projectId] as const,
  list: (projectId: string, params?: object) => [...taskKeys.all(projectId), params] as const,
  detail: (projectId: string, id: string) => [...taskKeys.all(projectId), id] as const,
}

// Liste des tâches d'un projet
export function useTasks(projectId: string, params?: {
  page?: number; limit?: number; statut?: string; wbs_id?: string
}) {
  return useQuery({
    queryKey: taskKeys.list(projectId, params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Tache>>(
        `/projects/${projectId}/tasks`, { params }
      )
      return data
    },
    enabled: !!projectId,
  })
}

// Créer une tâche
export function useCreateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Tache>) => {
      const { data } = await api.post<Tache>(`/projects/${projectId}/tasks`, dto)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(projectId) })
      qc.invalidateQueries({ queryKey: ['evm', projectId] })
    },
  })
}

// Mettre à jour une tâche (avec mutation optimiste)
export function useUpdateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Tache> & { id: string }) => {
      const { data } = await api.patch<Tache>(`/projects/${projectId}/tasks/${id}`, dto)
      return data
    },
    onMutate: async ({ id, ...dto }) => {
      await qc.cancelQueries({ queryKey: taskKeys.list(projectId) })
      const previous = qc.getQueryData<PaginatedResponse<Tache>>(taskKeys.list(projectId))
      if (previous) {
        qc.setQueryData<PaginatedResponse<Tache>>(taskKeys.list(projectId), {
          ...previous,
          data: previous.data.map((t) => (t.id === id ? { ...t, ...dto } : t)),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(taskKeys.list(projectId), ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(projectId) })
      qc.invalidateQueries({ queryKey: ['evm', projectId] })
    },
  })
}

// Supprimer une tâche
export function useDeleteTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`)
      return taskId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(projectId) })
      qc.invalidateQueries({ queryKey: ['evm', projectId] })
    },
  })
}
