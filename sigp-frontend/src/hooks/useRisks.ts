import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Risque, NiveauRisque, StatutRisque, RisqueCategorie } from '@/types'

// ── Backend DTO ───────────────────────────────────────────────────────────────

interface RisqueResponseDto {
  id: string
  projectId: string
  wbsId: string | null
  code: string | null
  description: string
  categorie: string | null
  probabilite: string  // RiskProbability: FAIBLE | POSSIBLE | PROBABLE | QUASI_CERTAIN
  impact: string       // RiskImpact: FAIBLE | MODERE | IMPORTANT | CRITIQUE
  niveauCriticite: string
  statut: string       // RiskStatus: OUVERT | EN_COURS | RESOLU | ACCEPTE | FERME
  planAction: string | null
  responsableId: string | null
  dateDetection: string | null
  dateEcheance: string | null
  createdAt: string
  updatedAt: string
}

// ── Enum mappings ─────────────────────────────────────────────────────────────

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

// ── Adapter: backend DTO → frontend Risque ────────────────────────────────────

function adaptRisque(dto: RisqueResponseDto): Risque {
  const prob = probToNumber(dto.probabilite)
  const imp  = impactToNumber(dto.impact)
  return {
    id:                   dto.id,
    projet_id:            dto.projectId,
    code_risque:          dto.code ?? `RSQ-${dto.id.slice(0, 8).toUpperCase()}`,
    description:          dto.description,
    categorie:            (dto.categorie ?? 'Technique') as RisqueCategorie,
    probabilite:          prob,
    impact:               imp,
    criticite:            prob * imp,
    niveau_criticite:     niveauToFe(dto.niveauCriticite),
    statut:               beStatutToFe(dto.statut),
    responsable:          dto.responsableId ?? '',
    plan_mitigation:      dto.planAction ?? undefined,
    date_identification:  isoDate(dto.dateDetection) ?? isoDate(dto.createdAt) ?? '',
    date_revision_prevue: isoDate(dto.dateEcheance),
    createdAt:            dto.createdAt,
    updatedAt:            dto.updatedAt,
  }
}

// ── Payload builders ──────────────────────────────────────────────────────────

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

function extractDtos(data: unknown): RisqueResponseDto[] {
  const unwrapped = (data as any)?.data ?? data
  const list = Array.isArray(unwrapped) ? unwrapped : ((unwrapped as any)?.data ?? [])
  return Array.isArray(list) ? list : []
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useRisks(projectId: string) {
  return useQuery({
    queryKey: ['risks', projectId],
    queryFn: async () => {
      const { data } = await api.get('/risques', { params: { projectId, limit: 100 } })
      const risques = extractDtos(data).map(adaptRisque)
      return { data: risques, meta: { total: risques.length, page: 1, limit: 100, totalPages: 1 } }
    },
    enabled: !!projectId,
  })
}

export function useRiskMatrix(_projectId: string) {
  return useQuery({
    queryKey: ['risks-matrix', _projectId],
    queryFn: async () => null,
    enabled: false,
  })
}

export function useCreateRisk(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Risque>) => {
      const payload = buildCreatePayload(projectId, dto)
      const { data } = await api.post('/risques', payload)
      return adaptRisque(data?.data ?? data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks', projectId] }),
  })
}

export function useUpdateRisk(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Risque> & { id: string }) => {
      const payload = buildUpdatePayload(dto)
      const { data } = await api.patch(`/risques/${id}`, payload)
      return adaptRisque(data?.data ?? data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks', projectId] }),
  })
}

export function useDeleteRisk(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (riskId: string) => {
      await api.delete(`/risques/${riskId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks', projectId] }),
  })
}
