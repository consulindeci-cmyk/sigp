import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'
import { dashboardKeys } from '@/hooks/useDashboard'
import type { Risque, NiveauRisque, RisqueCategorie } from '@/types'

// ── Ligne Supabase (colonnes snake_case de la table `risques`) ────────────────
// responsable_id/statut/date_detection/date_echeance existent toujours en base
// (lus par d'autres écrans en lecture seule, cf. reportBuilder.ts) mais ne
// sont plus collectés ni affichés par ce module CRUD (formulaire Nouveau
// risque) — cf. suppression Responsable/Statut/Dates du formulaire.

interface RisqueRow {
  id: string
  project_id: string
  wbs_id: string | null
  code: string | null
  description: string
  categorie: string | null
  probabilite: string  // '1' | '2' | '3' (ou ancienne valeur textuelle héritée)
  impact: string        // '1' | '2' | '3' (ou ancienne valeur textuelle héritée)
  niveau_criticite: string
  strategie: string | null
  created_at: string
  updated_at: string
}

const RISQUE_SELECT = `
  id, project_id, wbs_id, code, description, categorie, probabilite, impact,
  niveau_criticite, strategie, created_at, updated_at
`

// ── Scoring 3×3 (P/I 1-3, score 1-9) — cf. _shared/risk-scoring.ts côté
// serveur (même logique, dupliquée car aucun module partagé front/back).
// Les anciennes valeurs textuelles (FAIBLE/POSSIBLE/PROBABLE/QUASI_CERTAIN,
// FAIBLE/MODERE/IMPORTANT/CRITIQUE) restent acceptées en lecture pour les
// risques jamais réenregistrés depuis l'unification du scoring.

const LEGACY_PROB_SCORE: Record<string, 1 | 2 | 3> = {
  FAIBLE: 1, POSSIBLE: 1, PROBABLE: 2, QUASI_CERTAIN: 3,
}
const LEGACY_IMPACT_SCORE: Record<string, 1 | 2 | 3> = {
  FAIBLE: 1, MODERE: 2, IMPORTANT: 2, CRITIQUE: 3,
}

function parseScore(v: string, legacy: Record<string, 1 | 2 | 3>): 1 | 2 | 3 {
  const n = Number(v)
  if (n === 1 || n === 2 || n === 3) return n
  return legacy[v] ?? 1
}

// ELEVE/MOYEN sont les nouveaux paliers ; CRITIQUE/MODERE restent mappés sur
// l'équivalent le plus proche pour les risques jamais réenregistrés depuis
// l'unification du scoring.
function niveauToFe(n: string): NiveauRisque {
  if (n === 'ELEVE' || n === 'CRITIQUE') return 'ELEVE'
  if (n === 'MOYEN' || n === 'MODERE') return 'MOYEN'
  return 'FAIBLE'
}

// ── Adapter: ligne Supabase → Risque frontend ─────────────────────────────────

function adaptRisque(row: RisqueRow): Risque {
  const prob = parseScore(row.probabilite, LEGACY_PROB_SCORE)
  const imp = parseScore(row.impact, LEGACY_IMPACT_SCORE)
  return {
    id:               row.id,
    projet_id:        row.project_id,
    code_risque:      row.code ?? `RSQ-${row.id.slice(0, 8).toUpperCase()}`,
    description:      row.description,
    categorie:        (row.categorie ?? 'Technique') as RisqueCategorie,
    probabilite:      prob,
    impact:           imp,
    criticite:        prob * imp,
    niveau_criticite: niveauToFe(row.niveau_criticite),
    strategie:        row.strategie,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  }
}

// ── Payload builders ───────────────────────────────────────────────────────

function buildCreatePayload(projectId: string, dto: Partial<Risque>) {
  return {
    projectId,
    description: dto.description ?? '',
    probabilite: String(dto.probabilite ?? 1),
    impact:      String(dto.impact ?? 1),
    code:        dto.code_risque || undefined,
    categorie:   dto.categorie   || undefined,
    strategie:   dto.strategie   || undefined,
  }
}

function buildUpdatePayload(dto: Partial<Risque>) {
  const p: Record<string, unknown> = {}
  if (dto.description !== undefined) p.description = dto.description
  if (dto.probabilite !== undefined) p.probabilite = String(dto.probabilite)
  if (dto.impact      !== undefined) p.impact      = String(dto.impact)
  if (dto.categorie   !== undefined) p.categorie   = dto.categorie
  if (dto.code_risque !== undefined) p.code        = dto.code_risque
  if (dto.strategie   !== undefined) p.strategie   = dto.strategie
  return p
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useRisks(projectId: string) {
  return useQuery({
    queryKey: ['risks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('risques')
        .select(RISQUE_SELECT)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      const rows = data as unknown as RisqueRow[]
      const risques = rows.map(row => adaptRisque(row))
      return { data: risques, meta: { total: risques.length, page: 1, limit: 100, totalPages: 1 } }
    },
    enabled: !!projectId,
  })
}

export function useCreateRisk(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Risque>) => {
      const payload = buildCreatePayload(projectId, dto)
      const { data } = await invokeEdgeFunction<{ data: RisqueRow }>('risques-create', payload)
      return adaptRisque(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['risks', projectId] })
      qc.invalidateQueries({ queryKey: dashboardKeys.global() })
    },
  })
}

export function useUpdateRisk(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Risque> & { id: string }) => {
      const payload = buildUpdatePayload(dto)
      const { data } = await invokeEdgeFunction<{ data: RisqueRow }>('risques-update', { id, ...payload })
      return adaptRisque(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['risks', projectId] })
      qc.invalidateQueries({ queryKey: dashboardKeys.global() })
    },
  })
}

export function useDeleteRisk(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (riskId: string) => {
      await invokeEdgeFunction<{ message: string }>('risques-delete', { id: riskId })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['risks', projectId] })
      qc.invalidateQueries({ queryKey: dashboardKeys.global() })
    },
  })
}
