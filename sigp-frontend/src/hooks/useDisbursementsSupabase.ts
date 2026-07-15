// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Disbursements via Supabase (chantier Budget, 4/5).
// Pas de project_id direct sur disbursements — organisation résolue via
// budget_version_id / budget_ligne_id / contract_id / funding_source_id
// (voir disbursement_organisation_id() côté SQL).
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const disbursementsSupabaseKeys = {
  all: ['disbursements-supabase'] as const,
  list: () => [...disbursementsSupabaseKeys.all, 'list'] as const,
}

export interface DisbursementSupabaseRow {
  id: string
  budget_version_id: string | null
  funding_source_id: string | null
  statut: string
  montant: number
}

export function useDisbursementsSupabase() {
  return useQuery({
    queryKey: disbursementsSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disbursements')
        .select('id, budget_version_id, funding_source_id, statut, montant')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as DisbursementSupabaseRow[]
    },
  })
}

export function useCreateDisbursementSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      montant: number; budgetVersionId?: string; budgetLineId?: string;
      fundingSourceId?: string; contractId?: string;
      statut?: 'PLANIFIE' | 'DEMANDE' | 'APPROUVE' | 'DECAISSE' | 'REJETE';
    }) => invokeEdgeFunction<{ data: unknown }>('disbursements-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: disbursementsSupabaseKeys.all }),
  })
}

export function useDeleteDisbursementSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('disbursements-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: disbursementsSupabaseKeys.all }),
  })
}
