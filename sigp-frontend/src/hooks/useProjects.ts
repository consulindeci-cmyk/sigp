import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Projet, PaginatedResponse } from '@/types'
import type { ProjectApiDto } from '@/lib/projectAdapter'

export interface ProjectTopRisk {
  id: string;
  description: string;
  niveauCriticite: string;
  probabilite: string;
  impact: string;
  strategie: string | null;
  statut: string;
}

export interface CriticalActivityResponse {
  id: string;
  code: string;
  nom: string;
  responsable: string | null;
  statut: string;
  avancement: number;
  dateFinPrevue: string | null;
  joursRetard: number;
}

export interface DisbursementMonthly {
  month: string;
  montantPrevu: number;
  montantPaye: number;
}

export interface BudgetDistributionItem {
  rubrique: string;
  montant: number;
}

export interface FundingSourceItem {
  source: string;
  montant: number;
  pourcentage: number;
}

export interface MilestoneItem {
  id: string;
  titre: string;
  datePrevue: string | null;
  statut: string;
}

export const projectKeys = {
  all: ['projects'] as const,
  list: (params?: object) => [...projectKeys.all, 'list', params] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  summary: (id: string) => [...projectKeys.all, 'summary', id] as const,
  topRisks: (id: string) => [...projectKeys.all, 'topRisks', id] as const,
  criticalActivities: (id: string) => [...projectKeys.all, 'criticalActivities', id] as const,
  disbursementsMonthly: (id: string) => [...projectKeys.all, 'disbursementsMonthly', id] as const,
  budgetDistribution: (id: string) => [...projectKeys.all, 'budgetDistribution', id] as const,
  fundingSources: (id: string) => [...projectKeys.all, 'fundingSources', id] as const,
  milestones: (id: string) => [...projectKeys.all, 'milestones', id] as const,
}

// Liste des projets
export function useProjects(params?: {
  page?: number; limit?: number; search?: string; statut?: string
}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get('/projects', { params })
      return (data?.data ?? data) as PaginatedResponse<ProjectApiDto>
    },
  })
}

// Détail d'un projet
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}`)
      return (data?.data ?? data) as ProjectApiDto
    },
    enabled: !!id,

    refetchOnWindowFocus: false,
  })
}

// Résumé financier
export function useProjectSummary(id: string) {
  return useQuery({
    queryKey: projectKeys.summary(id),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}/summary`)
      return data?.data ?? data
    },
    enabled: !!id,

    refetchOnWindowFocus: false,
  })
}

// Top 5 risques actifs
export function useProjectTopRisks(projectId: string) {
  return useQuery({
    queryKey: projectKeys.topRisks(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/risks/top`)
      return (data?.data ?? data) as ProjectTopRisk[]
    },
    enabled: !!projectId,

    refetchOnWindowFocus: false,
  })
}

// Activités PTBA critiques (en retard)
export function useProjectCriticalActivities(projectId: string) {
  return useQuery({
    queryKey: projectKeys.criticalActivities(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/ptba/critical`)
      return (data?.data ?? data) as CriticalActivityResponse[]
    },
    enabled: !!projectId,

    refetchOnWindowFocus: false,
  })
}

// Décaissements mensuels
export function useProjectDisbursements(projectId: string) {
  return useQuery({
    queryKey: projectKeys.disbursementsMonthly(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/disbursements/monthly`)
      return (data?.data ?? data) as DisbursementMonthly[]
    },
    enabled: !!projectId,

    refetchOnWindowFocus: false,
  })
}

// Répartition budget par rubrique
export function useProjectBudgetDistribution(projectId: string) {
  return useQuery({
    queryKey: projectKeys.budgetDistribution(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/budget/distribution`)
      return (data?.data ?? data) as BudgetDistributionItem[]
    },
    enabled: !!projectId,

    refetchOnWindowFocus: false,
  })
}

// Sources de financement
export function useProjectFundingSources(projectId: string) {
  return useQuery({
    queryKey: projectKeys.fundingSources(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/funding-sources`)
      return (data?.data ?? data) as FundingSourceItem[]
    },
    enabled: !!projectId,

    refetchOnWindowFocus: false,
  })
}

// Jalons (livrables)
export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: projectKeys.milestones(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/milestones`)
      return (data?.data ?? data) as MilestoneItem[]
    },
    enabled: !!projectId,

    refetchOnWindowFocus: false,
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
