// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Budget Versions via Supabase (chantier Budget, 1/5).
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const budgetVersionsSupabaseKeys = {
  all: ['budget-versions-supabase'] as const,
  list: () => [...budgetVersionsSupabaseKeys.all, 'list'] as const,
}

export interface BudgetVersionSupabaseRow {
  id: string
  project_id: string
  version: number
  nom: string
  statut: string
  montant_total: number
}

export function useBudgetVersionsSupabase() {
  return useQuery({
    queryKey: budgetVersionsSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_versions')
        .select('id, project_id, version, nom, statut, montant_total')
        .order('version', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as BudgetVersionSupabaseRow[]
    },
  })
}

export function useCreateBudgetVersionSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      projectId: string; version: number; nom: string; montantTotal?: number;
      statut?: 'BROUILLON' | 'SOUMIS' | 'APPROUVE' | 'REVISE' | 'CLOTURE';
    }) => invokeEdgeFunction<{ data: unknown }>('budget-versions-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetVersionsSupabaseKeys.all }),
  })
}

export function useDeleteBudgetVersionSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('budget-versions-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetVersionsSupabaseKeys.all }),
  })
}
