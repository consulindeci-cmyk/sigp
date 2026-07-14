import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
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

export interface UseProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  statut?: string;
  programmeId?: string;
  managerId?: string;
}

// Liste des projets avec pagination, tri, recherche et filtres côté serveur
export function useProjects(params?: UseProjectsParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const queryParams: Record<string, any> = {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      };
      if (params?.search) queryParams.search = params.search;
      if (params?.sortBy) queryParams.sortBy = params.sortBy;
      if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;
      if (params?.statut) queryParams.statut = params.statut;
      if (params?.programmeId) queryParams.programmeId = params.programmeId;
      if (params?.managerId) queryParams.managerId = params.managerId;
      if (params?.filters) {
        for (const [key, value] of Object.entries(params.filters)) {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'status' || key === 'statut') {
              let mappedStatus = value;
              switch (value) {
                case 'En bonne voie': mappedStatus = 'EN_COURS'; break;
                case 'À risque': mappedStatus = 'SUSPENDU'; break;
                case 'Clôturé': mappedStatus = 'CLOTURE'; break;
                case 'En préparation': mappedStatus = 'EN_PREPARATION'; break;
              }
              queryParams.statut = mappedStatus;
            } else if (key === 'donor' || key === 'bailleurPrincipal') {
              queryParams.bailleurPrincipal = value;
            } else if (key === 'sector' || key === 'secteur') {
              queryParams.secteur = value;
            } else if (key === 'country' || key === 'pays') {
              queryParams.pays = value;
            } else {
              queryParams[key] = value;
            }
          }
        }
      }

      const { data } = await api.get('/projects', { params: queryParams });

      // Shape 1: Wrapped by NestJS ResponseInterceptor -> { success: true, data: { data: [...], meta: { ... } } }
      if (data && data.data && data.data.meta && Array.isArray(data.data.data)) {
        return data.data as PaginatedResponse<ProjectApiDto>;
      }

      // Shape 2: Direct paginated response -> { data: [...], meta: { ... } }
      if (data && data.meta && Array.isArray(data.data)) {
        return data as PaginatedResponse<ProjectApiDto>;
      }

      // Shape 3 or fallback: Extract array whether wrapped or not
      const list = Array.isArray(data?.data?.data)
        ? data.data.data
        : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));

      const totalCount =
        data?.data?.meta?.total ??
        data?.meta?.total ??
        list.length;

      const totalPagesCount =
        (data?.data?.meta?.totalPages ??
          data?.meta?.totalPages ??
          Math.ceil(totalCount / (params?.limit ?? 20))) || 1;

      return {
        data: list,
        meta: {
          total: totalCount,
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          totalPages: totalPagesCount,
        },
      } as PaginatedResponse<ProjectApiDto>;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
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
      const raw = (data as any)?.data ?? data;
      return (Array.isArray(raw) ? raw : []) as ProjectTopRisk[]
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
      const raw = (data as any)?.data ?? data;
      return (Array.isArray(raw) ? raw : []) as CriticalActivityResponse[]
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
      const raw = (data as any)?.data ?? data;
      return (Array.isArray(raw) ? raw : []) as DisbursementMonthly[]
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
      const raw = (data as any)?.data ?? data;
      return (Array.isArray(raw) ? raw : []) as BudgetDistributionItem[]
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
      const raw = (data as any)?.data ?? data;
      return (Array.isArray(raw) ? raw : []) as FundingSourceItem[]
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
      const raw = (data as any)?.data ?? data;
      return (Array.isArray(raw) ? raw : []) as MilestoneItem[]
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
