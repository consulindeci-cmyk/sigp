import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export type DisbursementStatut = 'PLANIFIE' | 'DEMANDE' | 'APPROUVE' | 'DECAISSE' | 'REJETE'

export interface Disbursement {
  id: string
  fundingSourceId: string | null
  fundingSourceNom: string | null
  // budget_ligne_id/contract_id/budget_version_id sont de vraies colonnes,
  // fixées à la création uniquement (disbursements-update ne les accepte
  // pas — cf. useUpdateDisbursement ci-dessous) : sans elles, un décaissement
  // ne déclenchait jamais recalc_budget_ligne_montants côté montant_paye,
  // laissant l'AC de l'EVM et la colonne "Décaissé" du Budget figés à zéro
  // (cf. audit Décaissements).
  budgetLigneId: string | null
  contractId: string | null
  budgetVersionId: string | null
  statut: DisbursementStatut
  montant: number
  datePrevue: string | null
  dateReelle: string | null
  reference: string | null
  description: string | null
}

interface DisbursementRow {
  id: string
  funding_source_id: string | null
  budget_ligne_id: string | null
  contract_id: string | null
  budget_version_id: string | null
  statut: string
  montant: number
  date_prevue: string | null
  date_reelle: string | null
  reference: string | null
  description: string | null
  funding_source: { nom: string } | { nom: string }[] | null
}

// disbursements n'a pas de project_id direct — filtré via funding_source_id/
// budget_ligne_id/contract_id (voir useDisbursements ci-dessous). budget_
// ligne_id/contract_id ne sont volontairement PAS embarqués via la syntaxe
// PostgREST `budget_ligne:budget_lignes(...)` : contrairement à
// funding_source_id (FK réelle, déjà fonctionnelle), rien ne garantit une FK
// réelle sur ces deux colonnes (cf. incident useTasks.ts — un embed sur une
// relation non déclarée renvoie 400). Les libellés sont résolus côté
// composant à partir des listes déjà chargées (useContracts/useBudgetVersion).
const DISBURSEMENT_SELECT = `
  id, funding_source_id, budget_ligne_id, contract_id, budget_version_id,
  statut, montant, date_prevue, date_reelle,
  reference, description, funding_source:funding_sources(nom)
`

function adaptDisbursement(row: DisbursementRow): Disbursement {
  const fs = Array.isArray(row.funding_source) ? row.funding_source[0] : row.funding_source
  return {
    id: row.id,
    fundingSourceId: row.funding_source_id,
    fundingSourceNom: fs?.nom ?? null,
    budgetLigneId: row.budget_ligne_id,
    contractId: row.contract_id,
    budgetVersionId: row.budget_version_id,
    statut: row.statut as DisbursementStatut,
    montant: Number(row.montant ?? 0),
    datePrevue: row.date_prevue,
    dateReelle: row.date_reelle,
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
        .order('date_prevue', { ascending: false })
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
        fundingSourceId: dto.fundingSourceId || undefined,
        budgetLigneId: dto.budgetLigneId || undefined,
        contractId: dto.contractId || undefined,
        budgetVersionId: dto.budgetVersionId || undefined,
        statut: dto.statut,
        montant: dto.montant,
        datePrevue: dto.datePrevue || undefined,
        dateReelle: dto.dateReelle || undefined,
        reference: dto.reference || undefined,
        description: dto.description || undefined,
      })
      return adaptDisbursement(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: disbursementsKey(projectId, fundingSourceIds, budgetLigneIds, contractIds) }),
  })
}

export function useUpdateDisbursement(
  projectId: string, fundingSourceIds: string[], budgetLigneIds: string[] = [], contractIds: string[] = [],
) {
  const qc = useQueryClient()
  return useMutation({
    // disbursements-update n'accepte QUE contractId parmi les champs de
    // rattachement (budgetLigneId/fundingSourceId/budgetVersionId sont fixés
    // à la création — cf. commentaire sur Disbursement plus haut). Les
    // envoyer quand même serait sans effet côté serveur et laisserait croire
    // à tort qu'ils sont modifiables ; on ne transmet donc que ce qui compte
    // réellement, en cohérence avec les sélecteurs désactivés en mode édition.
    mutationFn: async ({ id, ...dto }: Partial<Disbursement> & { id: string }) => {
      const { data } = await invokeEdgeFunction<{ data: DisbursementRow }>('disbursements-update', {
        id,
        contractId: dto.contractId !== undefined ? (dto.contractId || null) : undefined,
        statut: dto.statut,
        montant: dto.montant,
        datePrevue: dto.datePrevue || undefined,
        dateReelle: dto.dateReelle || undefined,
        reference: dto.reference || undefined,
        description: dto.description || undefined,
      })
      return adaptDisbursement(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: disbursementsKey(projectId, fundingSourceIds, budgetLigneIds, contractIds) }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: disbursementsKey(projectId, fundingSourceIds, budgetLigneIds, contractIds) }),
  })
}
