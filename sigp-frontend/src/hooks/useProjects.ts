import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'
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
  detailSummary: (id: string) => [...projectKeys.all, 'detailSummary', id] as const,
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

// Colonnes aliasées en camelCase pour matcher exactement ProjectApiDto.
export const PROJECT_SELECT = `
  id, code, nom, description, statut,
  bailleurPrincipal:bailleur_principal,
  secteur, pays,
  managerId:manager_id,
  programmeId:programme_id,
  budgetTotal:budget_total,
  devise,
  dateDebut:date_debut,
  dateFinPrevue:date_fin_prevue,
  dateFinEffective:date_fin_effective,
  dateClotureEffective:date_cloture_effective,
  createdAt:created_at,
  updatedAt:updated_at,
  manager:users!manager_id(nom, prenom)
`

export type RawRow = ProjectApiDto & { manager: { nom: string; prenom: string } | null }

export function flatten(row: RawRow): ProjectApiDto {
  const { manager, ...rest } = row
  return {
    ...rest,
    managerNom: manager?.nom ?? null,
    managerPrenom: manager?.prenom ?? null,
  }
}

interface AggResult { progressScore: number; tauxDecaissement: number; composantes: number; activites: number; livrables: number }

// Réplique ProjectRepository.getBatchAggregations : 4 requêtes groupées pour
// l'ensemble des projets d'une page, pas une requête par projet (anti N+1).
// Exporté pour être réutilisé par projectExport.ts (même logique d'enrichissement).
export async function fetchBatchAggregations(projects: { id: string; budgetTotal: number | null }[]): Promise<Map<string, AggResult>> {
  const result = new Map<string, AggResult>()
  if (projects.length === 0) return result
  const projectIds = projects.map((p) => p.id)

  const [ptbaRes, livrablesRes, wbsRes, versionsRes] = await Promise.all([
    supabase.from('ptba_activites').select('project_id, statut, taux_realisation').is('deleted_at', null).in('project_id', projectIds),
    supabase.from('livrables').select('project_id').is('deleted_at', null).in('project_id', projectIds),
    supabase.from('wbs_nodes').select('project_id').is('deleted_at', null).is('parent_id', null).in('project_id', projectIds),
    supabase.from('budget_versions').select('id, project_id').is('deleted_at', null).in('project_id', projectIds),
  ])
  if (ptbaRes.error) throw ptbaRes.error
  if (livrablesRes.error) throw livrablesRes.error
  if (wbsRes.error) throw wbsRes.error
  if (versionsRes.error) throw versionsRes.error

  const versionIds = (versionsRes.data ?? []).map((v) => v.id)
  const versionToProject = new Map((versionsRes.data ?? []).map((v) => [v.id, v.project_id]))
  const budgetLignesRes = versionIds.length
    ? await supabase.from('budget_lignes').select('version_id, montant_prevu, montant_paye').is('deleted_at', null).in('version_id', versionIds)
    : { data: [] as { version_id: string; montant_prevu: number; montant_paye: number }[], error: null }
  if (budgetLignesRes.error) throw budgetLignesRes.error

  const activitesMap = new Map<string, { count: number; sumTaux: number }>()
  for (const a of ptbaRes.data ?? []) {
    const e = activitesMap.get(a.project_id) ?? { count: 0, sumTaux: 0 }
    e.count += 1; e.sumTaux += Number(a.taux_realisation ?? 0)
    activitesMap.set(a.project_id, e)
  }
  const livrablesMap = new Map<string, number>()
  for (const l of livrablesRes.data ?? []) livrablesMap.set(l.project_id, (livrablesMap.get(l.project_id) ?? 0) + 1)
  const composantesMap = new Map<string, number>()
  for (const w of wbsRes.data ?? []) composantesMap.set(w.project_id, (composantesMap.get(w.project_id) ?? 0) + 1)
  const budgetMap = new Map<string, { prevu: number; paye: number }>()
  for (const bl of budgetLignesRes.data ?? []) {
    const pid = versionToProject.get(bl.version_id)
    if (!pid) continue
    const e = budgetMap.get(pid) ?? { prevu: 0, paye: 0 }
    e.prevu += Number(bl.montant_prevu ?? 0); e.paye += Number(bl.montant_paye ?? 0)
    budgetMap.set(pid, e)
  }

  for (const project of projects) {
    const act = activitesMap.get(project.id) ?? { count: 0, sumTaux: 0 }
    const bud = budgetMap.get(project.id) ?? { prevu: 0, paye: 0 }
    const budgetTotal = bud.prevu > 0 ? bud.prevu : Number(project.budgetTotal ?? 0)
    const tauxDecaissement = budgetTotal > 0 ? Math.round((bud.paye / budgetTotal) * 10000) / 100 : 0
    result.set(project.id, {
      progressScore: act.count ? Math.round(act.sumTaux / act.count) : 0,
      tauxDecaissement,
      composantes: composantesMap.get(project.id) ?? 0,
      activites: act.count,
      livrables: livrablesMap.get(project.id) ?? 0,
    })
  }
  return result
}

// Liste des projets avec pagination, tri, recherche et filtres côté serveur (RLS gère l'org-scoping)
export function useProjects(params?: UseProjectsParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const page = params?.page ?? 1
      const limit = params?.limit ?? 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase.from('projects').select(PROJECT_SELECT, { count: 'exact' }).is('deleted_at', null)

      if (params?.search) {
        query = query.or(`nom.ilike.%${params.search}%,code.ilike.%${params.search}%`)
      }

      let statutFilter = params?.statut
      const filters = params?.filters ?? {}
      let bailleurFilter: string | undefined
      let secteurFilter: string | undefined
      let paysFilter: string | undefined
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue
        if (key === 'status' || key === 'statut') statutFilter = statusToStatut(String(value))
        else if (key === 'donor' || key === 'bailleurPrincipal') bailleurFilter = String(value)
        else if (key === 'sector' || key === 'secteur') secteurFilter = String(value)
        else if (key === 'country' || key === 'pays') paysFilter = String(value)
      }

      if (statutFilter) query = query.eq('statut', statutFilter)
      if (params?.programmeId) query = query.eq('programme_id', params.programmeId)
      if (params?.managerId) query = query.eq('manager_id', params.managerId)
      if (bailleurFilter) query = query.eq('bailleur_principal', bailleurFilter)
      if (secteurFilter) query = query.eq('secteur', secteurFilter)
      if (paysFilter) query = query.eq('pays', paysFilter)

      const sortColumnMap: Record<string, string> = {
        nom: 'nom', code: 'code', statut: 'statut', createdAt: 'created_at',
        budgetTotal: 'budget_total', dateFinPrevue: 'date_fin_prevue',
      }
      const sortCol = params?.sortBy && sortColumnMap[params.sortBy] ? sortColumnMap[params.sortBy] : 'created_at'
      query = query.order(sortCol, { ascending: params?.sortOrder === 'asc' }).range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      const rows = (data as unknown as RawRow[]).map(flatten)
      const aggMap = await fetchBatchAggregations(rows.map((r) => ({ id: r.id, budgetTotal: r.budgetTotal })))
      const enriched = rows.map((r) => ({
        ...r,
        ...(aggMap.get(r.id) ?? { progressScore: 0, tauxDecaissement: 0, composantes: 0, activites: 0, livrables: 0 }),
      }))

      const total = count ?? enriched.length
      return {
        data: enriched,
        meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      } as PaginatedResponse<ProjectApiDto>
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// Détail d'un projet (ligne enrichie, même agrégation que la liste)
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select(PROJECT_SELECT).eq('id', id).is('deleted_at', null).maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Projet introuvable')
      const row = flatten(data as unknown as RawRow)
      const detail = await invokeEdgeFunction<ProjectDetailSummary>('project-detail-summary', { projectId: id })
      return { ...row, ...detail.rowAggregation } as ProjectApiDto
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

// ── Widgets fiche-projet : un seul appel à project-detail-summary, partagé
// via React Query entre les 7 hooks dérivés (même principe que Dashboard).
interface ProjectDetailSummary {
  summary: {
    budgetTotal: number; montantEngage: number; montantPaye: number; soldeDisponible: number; tauxDecaissement: number;
    nombreActivites: number; activitesTerminees: number; activitesEnCours: number; activitesEnRetard: number;
    nombreLivrables: number; livrablesTermines: number; livrablesEnCours: number;
    nombreContrats: number; contratsActifs: number; nombreRisques: number; risquesCritiques: number;
    tauxAvancementGlobal: number; progressScore: number; profileScore: number; displayStatus: string;
  };
  rowAggregation: { progressScore: number; tauxDecaissement: number; composantes: number; activites: number; livrables: number };
  topRisks: ProjectTopRisk[];
  criticalActivities: CriticalActivityResponse[];
  disbursementsMonthly: DisbursementMonthly[];
  budgetDistribution: BudgetDistributionItem[];
  fundingSources: FundingSourceItem[];
  milestones: MilestoneItem[];
}

function useProjectDetailSummary(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detailSummary(projectId),
    queryFn: () => invokeEdgeFunction<ProjectDetailSummary>('project-detail-summary', { projectId }),
    enabled: !!projectId,
    refetchOnWindowFocus: false,
  })
}

// Résumé financier
export function useProjectSummary(id: string) {
  const query = useProjectDetailSummary(id)
  return { ...query, data: query.data?.summary }
}

// Top 5 risques actifs
export function useProjectTopRisks(projectId: string) {
  const query = useProjectDetailSummary(projectId)
  return { ...query, data: query.data?.topRisks ?? [] }
}

// Activités PTBA critiques (en retard)
export function useProjectCriticalActivities(projectId: string) {
  const query = useProjectDetailSummary(projectId)
  return { ...query, data: query.data?.criticalActivities ?? [] }
}

// Décaissements mensuels
export function useProjectDisbursements(projectId: string) {
  const query = useProjectDetailSummary(projectId)
  return { ...query, data: query.data?.disbursementsMonthly ?? [] }
}

// Répartition budget par rubrique
export function useProjectBudgetDistribution(projectId: string) {
  const query = useProjectDetailSummary(projectId)
  return { ...query, data: query.data?.budgetDistribution ?? [] }
}

// Sources de financement
export function useProjectFundingSources(projectId: string) {
  const query = useProjectDetailSummary(projectId)
  return { ...query, data: query.data?.fundingSources ?? [] }
}

// Jalons (livrables)
export function useProjectMilestones(projectId: string) {
  const query = useProjectDetailSummary(projectId)
  return { ...query, data: query.data?.milestones ?? [] }
}

// Créer un projet
export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const { data } = await invokeEdgeFunction<{ data: unknown }>('projects-create', { ...payload })
      return data
    },
    onSuccess: () => {
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
      const { data } = await invokeEdgeFunction<{ data: unknown }>('projects-update', { id: targetId, ...payload });
      return { id: targetId, data };
    },
    onSuccess: (result) => {
      if (result?.id) {
        qc.invalidateQueries({ queryKey: projectKeys.detail(result.id) });
        qc.invalidateQueries({ queryKey: projectKeys.detailSummary(result.id) });
      } else if (hookId) {
        qc.invalidateQueries({ queryKey: projectKeys.detail(hookId) });
        qc.invalidateQueries({ queryKey: projectKeys.detailSummary(hookId) });
      }
      qc.invalidateQueries({ queryKey: projectKeys.list() });
      qc.invalidateQueries({ queryKey: projectKeys.kpis() });
      qc.invalidateQueries({ queryKey: projectKeys.referenceOptions() });
    },
  })
}

// Supprimer un projet
export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('projects-delete', { id })
      return id
    },
    onSuccess: (deletedId) => {
      qc.invalidateQueries({ queryKey: projectKeys.list() })
      qc.invalidateQueries({ queryKey: projectKeys.kpis() })
      qc.invalidateQueries({ queryKey: projectKeys.detail(deletedId) })
    },
  })
}

// ── Options de référence (Phase 19.5) — distinct calculé côté client (petit volume) ──
export function useProjectsReferenceOptions() {
  return useQuery({
    queryKey: projectKeys.referenceOptions(),
    queryFn: async () => {
      const [secteurRes, paysRes, bailleurRes] = await Promise.all([
        supabase.from('projects').select('secteur').is('deleted_at', null).not('secteur', 'is', null),
        supabase.from('projects').select('pays').is('deleted_at', null).not('pays', 'is', null),
        supabase.from('projects').select('bailleur_principal').is('deleted_at', null).not('bailleur_principal', 'is', null),
      ])
      if (secteurRes.error) throw secteurRes.error
      if (paysRes.error) throw paysRes.error
      if (bailleurRes.error) throw bailleurRes.error

      const sectors = [...new Set((secteurRes.data ?? []).map((r) => r.secteur as string))].sort()
      const countries = [...new Set((paysRes.data ?? []).map((r) => r.pays as string))].sort()
      const donors = [...new Set((bailleurRes.data ?? []).map((r) => r.bailleur_principal as string))].sort()
      return { sectors, countries, donors };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── KPIs portefeuille (Phase 19.5) — RLS gère déjà l'isolation multi-tenant ──
export function useProjectsKPIs(filters?: Record<string, string | number | undefined>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'status' || key === 'statut') queryParams.statut = statusToStatut(String(value));
        else if (key === 'donor' || key === 'bailleurPrincipal') queryParams.bailleurPrincipal = String(value);
        else if (key === 'sector' || key === 'secteur') queryParams.secteur = String(value);
        else if (key === 'country' || key === 'pays') queryParams.pays = String(value);
        else queryParams[key] = value;
      }
    }
  }

  return useQuery({
    queryKey: projectKeys.kpis(queryParams),
    queryFn: async () => {
      const applyFilters = <T,>(q: T): T => {
        // deno-lint-ignore no-explicit-any
        let r = q as any
        if (queryParams.programmeId) r = r.eq('programme_id', String(queryParams.programmeId))
        if (queryParams.bailleurPrincipal) r = r.ilike('bailleur_principal', `%${queryParams.bailleurPrincipal}%`)
        if (queryParams.secteur) r = r.ilike('secteur', `%${queryParams.secteur}%`)
        if (queryParams.pays) r = r.ilike('pays', `%${queryParams.pays}%`)
        return r as T
      }
      const now = new Date().toISOString()

      const [enCoursRes, suspenduRes, clotureRes, annuleRes, enPreparationRes, enRetardRes, budgetRes, deviseRes] = await Promise.all([
        applyFilters(supabase.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'EN_COURS')),
        applyFilters(supabase.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'SUSPENDU')),
        applyFilters(supabase.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'CLOTURE')),
        applyFilters(supabase.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'ANNULE')),
        applyFilters(supabase.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'EN_PREPARATION')),
        applyFilters(supabase.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('statut', 'EN_COURS').lt('date_fin_prevue', now)),
        applyFilters(supabase.from('projects').select('budget_total').is('deleted_at', null)),
        applyFilters(supabase.from('projects').select('devise').is('deleted_at', null).order('created_at', { ascending: true }).limit(1)),
      ])
      for (const res of [enCoursRes, suspenduRes, clotureRes, annuleRes, enPreparationRes, enRetardRes, budgetRes, deviseRes]) {
        if (res.error) throw res.error
      }

      const budgetTotal = (budgetRes.data ?? []).reduce((s: number, p: { budget_total: number | null }) => s + Number(p.budget_total ?? 0), 0)
      const devise = deviseRes.data?.[0]?.devise ?? 'XOF'
      const sym = devise === 'EUR' ? '€' : devise === 'XOF' ? ' FCFA' : '$'
      const budgetPortefeuille = budgetTotal >= 1_000_000
        ? `${(budgetTotal / 1_000_000).toFixed(1)}M${sym}`
        : `${budgetTotal.toLocaleString('fr-FR')}${sym}`

      return {
        total: (enCoursRes.count ?? 0) + (suspenduRes.count ?? 0) + (clotureRes.count ?? 0) + (annuleRes.count ?? 0) + (enPreparationRes.count ?? 0),
        enBonneVoie: enCoursRes.count ?? 0,
        aRisque: suspenduRes.count ?? 0,
        enRetard: enRetardRes.count ?? 0,
        clotured: (clotureRes.count ?? 0) + (annuleRes.count ?? 0),
        budgetPortefeuille,
      };
    },
    staleTime: 30_000,
  });
}

// Compatibilité : formatBudget est ré-exporté depuis l'adaptateur
export { formatBudget };
