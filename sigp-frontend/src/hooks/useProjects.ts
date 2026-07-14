import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { PaginatedResponse } from '@/types'
import { statusToStatut, formatBudget, type ProjectApiDto, type CreateProjectPayload, type UpdateProjectPayload } from '@/lib/projectAdapter'

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
  kpis: (filters?: object) => [...projectKeys.all, 'kpis', filters] as const,
  referenceOptions: () => [...projectKeys.all, 'referenceOptions'] as const,
}

export interface UseProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | number | undefined>;
  statut?: string;
  programmeId?: string;
  managerId?: string;
}

// Liste des projets avec pagination, tri, recherche et filtres côté serveur
export function useProjects(params?: UseProjectsParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const queryParams: Record<string, string | number | undefined> = {
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
              queryParams.statut = statusToStatut(String(value));
            } else if (key === 'donor' || key === 'bailleurPrincipal') {
              queryParams.bailleurPrincipal = String(value);
            } else if (key === 'sector' || key === 'secteur') {
              queryParams.secteur = String(value);
            } else if (key === 'country' || key === 'pays') {
              queryParams.pays = String(value);
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
      const { data } = await api.get(`/projects/${id}`);
      const raw = data?.data?.data ?? data?.data ?? data;
      return raw as ProjectApiDto;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

// Résumé financier
export function useProjectSummary(id: string) {
  return useQuery({
    queryKey: projectKeys.summary(id),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}/summary`);
      return data?.data?.data ?? data?.data ?? data;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

// Top 5 risques actifs
export function useProjectTopRisks(projectId: string) {
  return useQuery({
    queryKey: projectKeys.topRisks(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/risks/top`);
      const raw = Array.isArray(data?.data?.data)
        ? data.data.data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
      return raw as ProjectTopRisk[];
    },
    enabled: !!projectId,
    refetchOnWindowFocus: false,
  });
}

// Activités PTBA critiques (en retard)
export function useProjectCriticalActivities(projectId: string) {
  return useQuery({
    queryKey: projectKeys.criticalActivities(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/ptba/critical`);
      const raw = Array.isArray(data?.data?.data)
        ? data.data.data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
      return raw as CriticalActivityResponse[];
    },
    enabled: !!projectId,
    refetchOnWindowFocus: false,
  });
}

// Décaissements mensuels
export function useProjectDisbursements(projectId: string) {
  return useQuery({
    queryKey: projectKeys.disbursementsMonthly(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/disbursements/monthly`);
      const raw = Array.isArray(data?.data?.data)
        ? data.data.data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
      return raw as DisbursementMonthly[];
    },
    enabled: !!projectId,
    refetchOnWindowFocus: false,
  });
}

// Répartition budget par rubrique
export function useProjectBudgetDistribution(projectId: string) {
  return useQuery({
    queryKey: projectKeys.budgetDistribution(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/budget/distribution`);
      const raw = Array.isArray(data?.data?.data)
        ? data.data.data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
      return raw as BudgetDistributionItem[];
    },
    enabled: !!projectId,
    refetchOnWindowFocus: false,
  });
}

// Sources de financement
export function useProjectFundingSources(projectId: string) {
  return useQuery({
    queryKey: projectKeys.fundingSources(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/funding-sources`);
      const raw = Array.isArray(data?.data?.data)
        ? data.data.data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
      return raw as FundingSourceItem[];
    },
    enabled: !!projectId,
    refetchOnWindowFocus: false,
  });
}

// Jalons (livrables)
export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: projectKeys.milestones(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/milestones`);
      const raw = Array.isArray(data?.data?.data)
        ? data.data.data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
      return raw as MilestoneItem[];
    },
    enabled: !!projectId,
    refetchOnWindowFocus: false,
  });
}

// Créer un projet
export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const { data } = await api.post('/projects', payload)
      return data
    },
    onSuccess: () => {
      // Invalider uniquement les sous-arbres pertinents (P-02 : anti-query storm)
      qc.invalidateQueries({ queryKey: projectKeys.list() })
      qc.invalidateQueries({ queryKey: projectKeys.kpis() })
      qc.invalidateQueries({ queryKey: projectKeys.referenceOptions() })
    },
  })
}

// Mettre à jour un projet
export function useUpdateProject(hookId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; payload: UpdateProjectPayload } | UpdateProjectPayload) => {
      const targetId = 'id' in args && typeof args.id === 'string' ? args.id : hookId;
      const payload = 'id' in args && 'payload' in args ? args.payload : args;
      if (!targetId) throw new Error('ID du projet manquant pour la mise à jour');
      const { data } = await api.patch(`/projects/${targetId}`, payload);
      return { id: targetId, data };
    },
    onSuccess: (result) => {
      // Invalider précisément la fiche détaillée, la liste et les KPIs (P-02 : anti-query storm)
      if (result?.id) {
        qc.invalidateQueries({ queryKey: projectKeys.detail(result.id) });
      } else if (hookId) {
        qc.invalidateQueries({ queryKey: projectKeys.detail(hookId) });
      }
      qc.invalidateQueries({ queryKey: projectKeys.list() });
      qc.invalidateQueries({ queryKey: projectKeys.kpis() });
      // Les options de référence ne changent généralement pas lors d'une mise à jour,
      // mais on les invalide par sécurité si un champ Secteur/Pays/Bailleur a changé.
      qc.invalidateQueries({ queryKey: projectKeys.referenceOptions() });
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
    onSuccess: (deletedId) => {
      // Invalider uniquement les sous-arbres pertinents (P-02 : anti-query storm)
      qc.invalidateQueries({ queryKey: projectKeys.list() })
      qc.invalidateQueries({ queryKey: projectKeys.kpis() })
      qc.invalidateQueries({ queryKey: projectKeys.detail(deletedId) })
    },
  })
}

// ── Récupération des options de référence via endpoint dédié (Phase 19.5) ────────
// Remplace l'ancienne approche qui téléchargeait 1000 projets complets côté client.
export function useProjectsReferenceOptions() {
  return useQuery({
    queryKey: projectKeys.referenceOptions(),
    queryFn: async () => {
      const { data } = await api.get('/projects/reference-options');
      const payload = data?.data ?? data;
      return payload as { countries: string[]; sectors: string[]; donors: string[] };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Récupération des KPIs via endpoint dédié (Phase 19.5) ────────────────────────
// Remplace l'ancienne approche qui téléchargeait 10 000 projets complets côté client.
export function useProjectsKPIs(filters?: Record<string, string | number | undefined>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'status' || key === 'statut') {
          queryParams.statut = statusToStatut(String(value));
        } else if (key === 'donor' || key === 'bailleurPrincipal') {
          queryParams.bailleurPrincipal = String(value);
        } else if (key === 'sector' || key === 'secteur') {
          queryParams.secteur = String(value);
        } else if (key === 'country' || key === 'pays') {
          queryParams.pays = String(value);
        } else {
          queryParams[key] = value;
        }
      }
    }
  }

  return useQuery({
    queryKey: projectKeys.kpis(queryParams),
    queryFn: async () => {
      const { data } = await api.get('/projects/summary/kpis', { params: queryParams });
      const payload = data?.data ?? data;
      return payload as {
        total: number;
        enBonneVoie: number;
        aRisque: number;
        enRetard: number;
        clotured: number;
        budgetPortefeuille: string;
      };
    },
    staleTime: 30_000,
  });
}

// Compatibilité : formatBudget est ré-exporté depuis l'adaptateur
export { formatBudget };
