import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'
import type { Risque, NiveauRisque, StatutRisque, RisqueCategorie } from '@/types'

// ── Ligne Supabase (colonnes snake_case de la table `risques`) ────────────────

interface RisqueRow {
  id: string
  project_id: string
  wbs_id: string | null
  code: string | null
  description: string
  categorie: string | null
  probabilite: string  // FAIBLE | POSSIBLE | PROBABLE | QUASI_CERTAIN
  impact: string        // FAIBLE | MODERE | IMPORTANT | CRITIQUE
  niveau_criticite: string
  statut: string        // OUVERT | EN_COURS | RESOLU | ACCEPTE | FERME
  plan_action: string | null
  responsable_id: string | null
  date_detection: string | null
  date_echeance: string | null
  created_at: string
  updated_at: string
}

const RISQUE_SELECT = `
  id, project_id, wbs_id, code, description, categorie, probabilite, impact,
  niveau_criticite, statut, plan_action, responsable_id, date_detection,
  date_echeance, created_at, updated_at
`

// ── Enum mappings (inchangés — indépendants de la source de données) ─────────

function probToNumber(p: string): 1 | 2 | 3 {
  if (p === 'FAIBLE' || p === 'POSSIBLE') return 1
  if (p === 'PROBABLE') return 2
  return 3
}

function numberToProb(n: number | undefined): string {
  if (!n || n <= 1) return 'FAIBLE'
  if (n === 2) return 'PROBABLE'
  return 'QUASI_CERTAIN'
}

function impactToNumber(i: string): 1 | 2 | 3 {
  if (i === 'FAIBLE') return 1
  if (i === 'MODERE' || i === 'IMPORTANT') return 2
  return 3
}

function numberToImpact(n: number | undefined): string {
  if (!n || n <= 1) return 'FAIBLE'
  if (n === 2) return 'MODERE'
  return 'CRITIQUE'
}

function beStatutToFe(s: string): StatutRisque {
  if (s === 'EN_COURS') return 'EN_COURS'
  if (s === 'RESOLU' || s === 'ACCEPTE') return 'MAÎTRISÉ'
  if (s === 'FERME') return 'CLOS'
  return 'OUVERT'
}

function feStatutToBe(s: string): string {
  if (s === 'EN_COURS') return 'EN_COURS'
  if (s === 'MAÎTRISÉ') return 'RESOLU'
  if (s === 'CLOS') return 'FERME'
  return 'OUVERT'
}

function niveauToFe(n: string): NiveauRisque {
  if (n === 'CRITIQUE') return 'CRITIQUE'
  if (n === 'ELEVE') return 'ELEVE'
  if (n === 'MODERE') return 'MODERE'
  return 'FAIBLE'
}

function isoDate(val: string | null | undefined): string | undefined {
  if (!val) return undefined
  try { return new Date(val).toISOString().slice(0, 10) }
  catch { return undefined }
}

// ── Adapter: ligne Supabase → Risque frontend ─────────────────────────────────

function adaptRisque(row: RisqueRow): Risque {
  const prob = probToNumber(row.probabilite)
  const imp = impactToNumber(row.impact)
  return {
    id:                   row.id,
    projet_id:            row.project_id,
    code_risque:          row.code ?? `RSQ-${row.id.slice(0, 8).toUpperCase()}`,
    description:          row.description,
    categorie:            (row.categorie ?? 'Technique') as RisqueCategorie,
    probabilite:          prob,
    impact:               imp,
    criticite:            prob * imp,
    niveau_criticite:     niveauToFe(row.niveau_criticite),
    statut:               beStatutToFe(row.statut),
    responsable:          row.responsable_id ?? '',
    plan_mitigation:      row.plan_action ?? undefined,
    date_identification:  isoDate(row.date_detection) ?? isoDate(row.created_at) ?? '',
    date_revision_prevue: isoDate(row.date_echeance),
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
  }
}

// ── Payload builders (inchangés) ──────────────────────────────────────────────

function buildCreatePayload(projectId: string, dto: Partial<Risque>) {
  return {
    projectId,
    description:   dto.description ?? '',
    probabilite:   numberToProb(dto.probabilite),
    impact:        numberToImpact(dto.impact),
    code:          dto.code_risque        || undefined,
    categorie:     dto.categorie          || undefined,
    statut:        dto.statut             ? feStatutToBe(dto.statut) : undefined,
    planAction:    dto.plan_mitigation    || undefined,
    dateDetection: dto.date_identification    || undefined,
    dateEcheance:  dto.date_revision_prevue   || undefined,
  }
}

function buildUpdatePayload(dto: Partial<Risque>) {
  const p: Record<string, unknown> = {}
  if (dto.description          !== undefined) p.description   = dto.description
  if (dto.probabilite          !== undefined) p.probabilite   = numberToProb(dto.probabilite)
  if (dto.impact               !== undefined) p.impact        = numberToImpact(dto.impact)
  if (dto.categorie            !== undefined) p.categorie     = dto.categorie
  if (dto.code_risque          !== undefined) p.code          = dto.code_risque
  if (dto.statut               !== undefined) p.statut        = feStatutToBe(dto.statut)
  if (dto.plan_mitigation      !== undefined) p.planAction    = dto.plan_mitigation
  if (dto.date_identification  !== undefined) p.dateDetection = dto.date_identification
  if (dto.date_revision_prevue !== undefined) p.dateEcheance  = dto.date_revision_prevue
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
      const risques = (data as unknown as RisqueRow[]).map(adaptRisque)
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks', projectId] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks', projectId] }),
  })
}

export function useDeleteRisk(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (riskId: string) => {
      await invokeEdgeFunction<{ message: string }>('risques-delete', { id: riskId })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks', projectId] }),
  })
}
