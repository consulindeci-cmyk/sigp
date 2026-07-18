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
  // SUPER_ADMIN uniquement — filtre la liste sur les projets d'une
  // organisation donnée (résolu via organisation_programme_ids()).
  organisationId?: string;
  // SUPER_ADMIN uniquement — enrichit chaque ligne avec organisationNom.
  includeOrganisation?: boolean;
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

  const [ptbaRes, livrablesRes, wbsRes, budgetLignesRes] = await Promise.all([
    supabase.from('ptba_activites').select('project_id, statut, taux_realisation, montant_prevu').is('deleted_at', null).in('project_id', projectIds),
    supabase.from('livrables').select('project_id').is('deleted_at', null).in('project_id', projectIds),
    supabase.from('wbs_nodes').select('project_id').is('deleted_at', null).is('parent_id', null).in('project_id', projectIds),
    supabase.from('budget_lignes').select('montant_prevu, montant_paye, version:budget_versions!inner(project_id)').is('deleted_at', null).in('version.project_id', projectIds),
  ])
  if (ptbaRes.error) throw ptbaRes.error
  if (livrablesRes.error) throw livrablesRes.error
  if (wbsRes.error) throw wbsRes.error
  if (budgetLignesRes.error) throw budgetLignesRes.error

  // sumTaux/count restent pour référence ; ev alimente le vrai "progressScore"
  // (EV/BAC pondéré par le budget, même méthode que calculate_project_evm() /
  // l'onglet EVM — pas une moyenne brute des % d'avancement).
  const activitesMap = new Map<string, { count: number; sumTaux: number; ev: number }>()
  for (const a of ptbaRes.data ?? []) {
    const e = activitesMap.get(a.project_id) ?? { count: 0, sumTaux: 0, ev: 0 }
    e.count += 1; e.sumTaux += Number(a.taux_realisation ?? 0)
    e.ev += Number(a.montant_prevu ?? 0) * (Number(a.taux_realisation ?? 0) / 100)
    activitesMap.set(a.project_id, e)
  }
  const livrablesMap = new Map<string, number>()
  for (const l of livrablesRes.data ?? []) livrablesMap.set(l.project_id, (livrablesMap.get(l.project_id) ?? 0) + 1)
  const composantesMap = new Map<string, number>()
  for (const w of wbsRes.data ?? []) composantesMap.set(w.project_id, (composantesMap.get(w.project_id) ?? 0) + 1)
  const budgetMap = new Map<string, { prevu: number; paye: number }>()
  for (const bl of (budgetLignesRes.data ?? [])) {
    const pid = Array.isArray(bl.version) ? bl.version[0]?.project_id : (bl.version as { project_id?: string })?.project_id
    if (!pid) continue
    const e = budgetMap.get(pid) ?? { prevu: 0, paye: 0 }
    e.prevu += Number(bl.montant_prevu ?? 0); e.paye += Number(bl.montant_paye ?? 0)
    budgetMap.set(pid, e)
  }

  for (const project of projects) {
    const act = activitesMap.get(project.id) ?? { count: 0, sumTaux: 0, ev: 0 }
    const bud = budgetMap.get(project.id) ?? { prevu: 0, paye: 0 }
    const budgetTotal = bud.prevu > 0 ? bud.prevu : Number(project.budgetTotal ?? 0)
    const tauxDecaissement = budgetTotal > 0 ? Math.round((bud.paye / budgetTotal) * 10000) / 100 : 0
    // BAC strict (somme des budget_lignes réelles, sans repli sur
    // project.budgetTotal) — même définition que calculate_project_evm(),
    // pour que ce "progressScore" reste identique à celui affiché sur la
    // fiche projet (Informations Générales) et l'onglet EVM.
    const progressScore = bud.prevu > 0 ? Math.round((act.ev / bud.prevu) * 100) : 0
    result.set(project.id, {
      progressScore,
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
      let organisationFilter = params?.organisationId
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue
        if (key === 'status' || key === 'statut') statutFilter = statusToStatut(String(value))
        else if (key === 'donor' || key === 'bailleurPrincipal') bailleurFilter = String(value)
        else if (key === 'sector' || key === 'secteur') secteurFilter = String(value)
        else if (key === 'country' || key === 'pays') paysFilter = String(value)
        else if (key === 'organisation') organisationFilter = String(value)
      }

      if (statutFilter) query = query.eq('statut', statutFilter)
      if (params?.programmeId) query = query.eq('programme_id', params.programmeId)
      if (params?.managerId) query = query.eq('manager_id', params.managerId)
      if (bailleurFilter) query = query.eq('bailleur_principal', bailleurFilter)
      if (secteurFilter) query = query.eq('secteur', secteurFilter)
      if (paysFilter) query = query.eq('pays', paysFilter)

      if (organisationFilter) {
        const { data: programmeIds, error: programmeIdsError } = await supabase.rpc('organisation_programme_ids', {
          p_organisation_id: organisationFilter,
        })
        if (programmeIdsError) throw programmeIdsError
        // Organisation sans aucun programme (ou id refusé par la fonction) :
        // aucun projet ne doit matcher plutôt que de renvoyer toute la liste.
        query = query.in('programme_id', (programmeIds ?? []).length > 0 ? programmeIds : ['00000000-0000-0000-0000-000000000000'])
      }

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
      let enriched = rows.map((r) => ({
        ...r,
        ...(aggMap.get(r.id) ?? { progressScore: 0, tauxDecaissement: 0, composantes: 0, activites: 0, livrables: 0 }),
      }))

      // SUPER_ADMIN uniquement — résout le nom d'organisation de chaque
      // projet de la page en un seul appel groupé (anti N+1), pour la
      // colonne "Organisation" affichée sur la vue plateforme.
      if (params?.includeOrganisation) {
        const distinctProgrammeIds = Array.from(new Set(enriched.map((r) => r.programmeId).filter((id): id is string => !!id)))
        if (distinctProgrammeIds.length > 0) {
          const { data: orgRows, error: orgRowsError } = await supabase.rpc('programme_organisations_batch', {
            p_programme_ids: distinctProgrammeIds,
          })
          if (orgRowsError) throw orgRowsError
          const orgMap = new Map<string, string>(
            (orgRows ?? []).map((o: { programme_id: string; organisation_nom: string }) => [o.programme_id, o.organisation_nom] as [string, string])
          )
          enriched = enriched.map((r) => ({
            ...r,
            organisationNom: r.programmeId ? orgMap.get(r.programmeId) ?? null : null,
          }))
        }
      }

      const total = count ?? enriched.length
      return {
        data: enriched,
        meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      } as PaginatedResponse<ProjectApiDto>
    },
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000, // 3 min
  });
}

// Détail d'un projet — ligne brute uniquement (rapide, une seule requête).
// Les compteurs agrégés (progressScore, composantes, activites, livrables...)
// viennent de useProjectSummary/useProjectRowAggregation, qui partagent tous
// le même appel à project-detail-summary via useProjectDetailSummary — ne pas
// le ré-invoquer ici, ça doublait ce call coûteux à chaque ouverture de fiche
// projet pour un résultat de toute façon écrasé par le summary en aval.
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select(PROJECT_SELECT).eq('id', id).is('deleted_at', null).maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Projet introuvable')
      return flatten(data as unknown as RawRow)
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

// Compteurs bruts (composantes WBS, activités, livrables)
export function useProjectRowAggregation(id: string) {
  const query = useProjectDetailSummary(id)
  return { ...query, data: query.data?.rowAggregation }
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

// ── Options de référence (Phase 19.5) — distinct calculé côté client (petit volume, 1 seule requête) ──
export function useProjectsReferenceOptions() {
  return useQuery({
    queryKey: projectKeys.referenceOptions(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('secteur, pays, bailleur_principal')
        .is('deleted_at', null);
      if (error) throw error;

      const sectors = [...new Set((data ?? []).map((r) => r.secteur as string).filter(Boolean))].sort();
      const countries = [...new Set((data ?? []).map((r) => r.pays as string).filter(Boolean))].sort();
      const donors = [...new Set((data ?? []).map((r) => r.bailleur_principal as string).filter(Boolean))].sort();
      return { sectors, countries, donors };
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

// ── KPIs portefeuille (Phase 19.5) — 1 seule requête optimisée au lieu de 8 count() simultanés ──
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
      // SUPER_ADMIN uniquement — même résolution organisation → programme_id
      // que useProjects, pour que les KPIs restent cohérents avec la liste
      // filtrée affichée juste en-dessous.
      let organisationProgrammeIds: string[] | null = null
      if (queryParams.organisation) {
        const { data: ids, error: idsError } = await supabase.rpc('organisation_programme_ids', {
          p_organisation_id: String(queryParams.organisation),
        })
        if (idsError) throw idsError
        organisationProgrammeIds = (ids ?? []).length > 0 ? ids : ['00000000-0000-0000-0000-000000000000']
      }

      const applyFilters = <T,>(q: T): T => {
        // deno-lint-ignore no-explicit-any
        let r = q as any
        if (queryParams.programmeId) r = r.eq('programme_id', String(queryParams.programmeId))
        if (queryParams.bailleurPrincipal) r = r.ilike('bailleur_principal', `%${queryParams.bailleurPrincipal}%`)
        if (queryParams.secteur) r = r.ilike('secteur', `%${queryParams.secteur}%`)
        if (queryParams.pays) r = r.ilike('pays', `%${queryParams.pays}%`)
        if (organisationProgrammeIds) r = r.in('programme_id', organisationProgrammeIds)
        return r as T
      }
      const now = new Date().toISOString()

      const { data, error } = await applyFilters(
        supabase.from('projects').select('statut, budget_total, devise, date_fin_prevue').is('deleted_at', null)
      );
      if (error) throw error;

      const rows = (data ?? []) as { statut: string; budget_total: number | null; devise: string | null; date_fin_prevue: string | null }[];
      let enCours = 0, suspendu = 0, clotured = 0, enRetard = 0, total = rows.length, budgetTotal = 0;
      let devise = 'XOF';
      if (rows.length > 0 && rows[0].devise) devise = rows[0].devise;

      for (const p of rows) {
        if (p.statut === 'EN_COURS') {
          enCours++;
          if (p.date_fin_prevue && p.date_fin_prevue < now) enRetard++;
        } else if (p.statut === 'SUSPENDU') {
          suspendu++;
        } else if (p.statut === 'CLOTURE' || p.statut === 'ANNULE') {
          clotured++;
        }
        budgetTotal += Number(p.budget_total ?? 0);
      }

      const sym = devise === 'EUR' ? '€' : devise === 'XOF' ? ' FCFA' : '$';
      const budgetPortefeuille = budgetTotal >= 1_000_000
        ? `${(budgetTotal / 1_000_000).toFixed(1)}M${sym}`
        : `${budgetTotal.toLocaleString('fr-FR')}${sym}`;

      return {
        total,
        enBonneVoie: enCours,
        aRisque: suspendu,
        enRetard,
        clotured,
        budgetPortefeuille,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

// Compatibilité : formatBudget est ré-exporté depuis l'adaptateur
export { formatBudget };
