import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'
import { dashboardKeys } from '@/hooks/useDashboard'
import type { Disbursement } from '@/types/disbursement'

interface DisbursementRow {
  id: string
  budget_ligne_id: string | null
  budget_version_id: string | null
  montant: number
  devise: string
  date_prevue: string | null
  date_reelle: string | null
  reference: string | null
  description: string | null
}

// disbursements n'a pas de project_id direct — filtré via funding_source_id/
// budget_ligne_id/contract_id (voir useDisbursements ci-dessous). Ces deux
// derniers filtres sont conservés uniquement pour ne pas faire disparaître
// les décaissements créés AVANT la simplification (rattachés seulement à une
// Source de financement ou un Contrat, champs désormais retirés du
// formulaire) — tout nouveau décaissement est systématiquement rattaché à
// une Ligne Budgétaire (obligatoire).
const DISBURSEMENT_SELECT = `
  id, budget_ligne_id, budget_version_id,
  montant, devise, date_prevue, date_reelle,
  reference, description
`

function adaptDisbursement(row: DisbursementRow): Disbursement {
  return {
    id: row.id,
    budgetLigneId: row.budget_ligne_id,
    budgetVersionId: row.budget_version_id,
    montant: Number(row.montant ?? 0),
    devise: row.devise,
    date: row.date_reelle ?? row.date_prevue,
    reference: row.reference,
    description: row.description,
  }
}

// budgetLigneIds/contractIds élargissent le filtre au-delà du seul
// funding_source_id — sans ça, un décaissement créé avec une Ligne
// Budgétaire/un Contrat mais sans Source de financement disparaîtrait de la
// liste (jamais retourné par le .in('funding_source_id', ...) d'origine).
export function useDisbursements(
  projectId: string,
  fundingSourceIds: string[],
  budgetLigneIds: string[] = [],
  contractIds: string[] = [],
) {
  return useQuery({
    queryKey: ['disbursements', projectId, fundingSourceIds, budgetLigneIds, contractIds],
    queryFn: async () => {
      const clauses: string[] = []
      if (fundingSourceIds.length > 0) clauses.push(`funding_source_id.in.(${fundingSourceIds.join(',')})`)
      if (budgetLigneIds.length > 0) clauses.push(`budget_ligne_id.in.(${budgetLigneIds.join(',')})`)
      if (contractIds.length > 0) clauses.push(`contract_id.in.(${contractIds.join(',')})`)
      if (clauses.length === 0) return []

      const { data, error } = await supabase
        .from('disbursements')
        .select(DISBURSEMENT_SELECT)
        .or(clauses.join(','))
        .is('deleted_at', null)
        .order('reference', { ascending: true })
        .limit(200)
      if (error) throw error
      return (data as unknown as DisbursementRow[]).map(adaptDisbursement)
    },
    enabled: !!projectId,
  })
}

function disbursementsKey(projectId: string, fundingSourceIds: string[], budgetLigneIds: string[], contractIds: string[]) {
  return ['disbursements', projectId, fundingSourceIds, budgetLigneIds, contractIds] as const
}

export function useCreateDisbursement(
  projectId: string, fundingSourceIds: string[], budgetLigneIds: string[] = [], contractIds: string[] = [],
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Disbursement>) => {
      const { data } = await invokeEdgeFunction<{ data: DisbursementRow }>('disbursements-create', {
        // disbursements-create attend `budgetLineId` (anglais) et non
        // `budgetLigneId` — sans ce mapping, le rattachement à la ligne
        // budgétaire échouait silencieusement à chaque création (aucune
        // erreur renvoyée, budget_ligne_id restait null en base).
        budgetLineId: dto.budgetLigneId || undefined,
        budgetVersionId: dto.budgetVersionId || undefined,
        montant: dto.montant,
        devise: dto.devise || undefined,
        date: dto.date || undefined,
        reference: dto.reference || undefined,
        description: dto.description || undefined,
      })
      return adaptDisbursement(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disbursementsKey(projectId, fundingSourceIds, budgetLigneIds, contractIds) })
      qc.invalidateQueries({ queryKey: dashboardKeys.global() })
    },
  })
}

export function useUpdateDisbursement(
  projectId: string, fundingSourceIds: string[], budgetLigneIds: string[] = [], contractIds: string[] = [],
) {
  const qc = useQueryClient()
  return useMutation({
    // disbursements-update n'accepte plus que montant/date/description —
    // budgetLigneId/budgetVersionId sont fixés à la création (cf. Disbursement
    // plus haut) et reference est générée une fois pour toutes, jamais
    // renvoyée ici.
    mutationFn: async ({ id, ...dto }: Partial<Disbursement> & { id: string }) => {
      const { data } = await invokeEdgeFunction<{ data: DisbursementRow }>('disbursements-update', {
        id,
        montant: dto.montant,
        date: dto.date || undefined,
        description: dto.description || undefined,
      })
      return adaptDisbursement(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disbursementsKey(projectId, fundingSourceIds, budgetLigneIds, contractIds) })
      qc.invalidateQueries({ queryKey: dashboardKeys.global() })
    },
  })
}

export function useDeleteDisbursement(
  projectId: string, fundingSourceIds: string[], budgetLigneIds: string[] = [], contractIds: string[] = [],
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('disbursements-delete', { id })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disbursementsKey(projectId, fundingSourceIds, budgetLigneIds, contractIds) })
      qc.invalidateQueries({ queryKey: dashboardKeys.global() })
    },
  })
}
