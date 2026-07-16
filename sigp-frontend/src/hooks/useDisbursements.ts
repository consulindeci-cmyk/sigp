import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export type DisbursementStatut = 'PLANIFIE' | 'DEMANDE' | 'APPROUVE' | 'DECAISSE' | 'REJETE'

export interface Disbursement {
  id: string
  fundingSourceId: string | null
  fundingSourceNom: string | null
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
  statut: string
  montant: number
  date_prevue: string | null
  date_reelle: string | null
  reference: string | null
  description: string | null
  funding_source: { nom: string } | { nom: string }[] | null
}

// disbursements n'a pas de project_id direct — filtré via son unique lien
// vers funding_sources (le seul chemin pertinent pour cette fiche projet ;
// budget_version_id/budget_ligne_id/contract_id restent nullable et hors
// scope de cet onglet, cf. commentaire de la migration RLS).
const DISBURSEMENT_SELECT = `
  id, funding_source_id, statut, montant, date_prevue, date_reelle,
  reference, description, funding_source:funding_sources(nom)
`

function adaptDisbursement(row: DisbursementRow): Disbursement {
  const fs = Array.isArray(row.funding_source) ? row.funding_source[0] : row.funding_source
  return {
    id: row.id,
    fundingSourceId: row.funding_source_id,
    fundingSourceNom: fs?.nom ?? null,
    statut: row.statut as DisbursementStatut,
    montant: Number(row.montant ?? 0),
    datePrevue: row.date_prevue,
    dateReelle: row.date_reelle,
    reference: row.reference,
    description: row.description,
  }
}

export function useDisbursements(projectId: string, fundingSourceIds: string[]) {
  return useQuery({
    queryKey: ['disbursements', projectId, fundingSourceIds],
    queryFn: async () => {
      if (fundingSourceIds.length === 0) return []
      const { data, error } = await supabase
        .from('disbursements')
        .select(DISBURSEMENT_SELECT)
        .in('funding_source_id', fundingSourceIds)
        .is('deleted_at', null)
        .order('date_prevue', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data as unknown as DisbursementRow[]).map(adaptDisbursement)
    },
    enabled: !!projectId,
  })
}

export function useCreateDisbursement(projectId: string, fundingSourceIds: string[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Disbursement>) => {
      const { data } = await invokeEdgeFunction<{ data: DisbursementRow }>('disbursements-create', {
        fundingSourceId: dto.fundingSourceId || undefined,
        statut: dto.statut,
        montant: dto.montant,
        datePrevue: dto.datePrevue || undefined,
        dateReelle: dto.dateReelle || undefined,
        reference: dto.reference || undefined,
        description: dto.description || undefined,
      })
      return adaptDisbursement(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disbursements', projectId, fundingSourceIds] }),
  })
}

export function useUpdateDisbursement(projectId: string, fundingSourceIds: string[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Disbursement> & { id: string }) => {
      const { data } = await invokeEdgeFunction<{ data: DisbursementRow }>('disbursements-update', {
        id,
        statut: dto.statut,
        montant: dto.montant,
        datePrevue: dto.datePrevue || undefined,
        dateReelle: dto.dateReelle || undefined,
        reference: dto.reference || undefined,
        description: dto.description || undefined,
      })
      return adaptDisbursement(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disbursements', projectId, fundingSourceIds] }),
  })
}

export function useDeleteDisbursement(projectId: string, fundingSourceIds: string[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('disbursements-delete', { id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disbursements', projectId, fundingSourceIds] }),
  })
}
