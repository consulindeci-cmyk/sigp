// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Budget Lines via Supabase (chantier Budget, 2/5).
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const budgetLinesSupabaseKeys = {
  all: ['budget-lines-supabase'] as const,
  list: (versionId: string | null) => [...budgetLinesSupabaseKeys.all, 'list', versionId] as const,
}

export interface BudgetLineSupabaseRow {
  id: string
  version_id: string
  code_ligne: string
  libelle: string
  montant_prevu: number
  montant_engage: number
  montant_paye: number
}

export function useBudgetLinesSupabase(versionId: string | null) {
  return useQuery({
    queryKey: budgetLinesSupabaseKeys.list(versionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_lignes')
        .select('id, version_id, code_ligne, libelle, montant_prevu, montant_engage, montant_paye')
        .eq('version_id', versionId as string)
        .order('ordre', { ascending: true })
      if (error) throw error
      return data as BudgetLineSupabaseRow[]
    },
    enabled: !!versionId,
  })
}

export function useCreateBudgetLineSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      versionId: string; codeLigne: string; libelle: string;
      montantPrevu?: number; montantEngage?: number; montantPaye?: number;
    }) => invokeEdgeFunction<{ data: unknown }>('budget-lines-create', payload),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: budgetLinesSupabaseKeys.list(variables.versionId) }),
  })
}

export function useDeleteBudgetLineSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; versionId: string }) =>
      invokeEdgeFunction<{ message: string }>('budget-lines-delete', { id: payload.id }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: budgetLinesSupabaseKeys.list(variables.versionId) }),
  })
}
