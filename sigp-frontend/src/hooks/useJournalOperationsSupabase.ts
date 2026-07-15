// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Journal Operations via Supabase (chantier Budget, 5/5 — DERNIÈRE ÉTAPE).
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const journalOperationsSupabaseKeys = {
  all: ['journal-operations-supabase'] as const,
  list: () => [...journalOperationsSupabaseKeys.all, 'list'] as const,
}

export interface JournalOperationSupabaseRow {
  id: string
  budget_ligne_id: string
  type: string
  montant: number
  date_operation: string
}

export function useJournalOperationsSupabase() {
  return useQuery({
    queryKey: journalOperationsSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_operations')
        .select('id, budget_ligne_id, type, montant, date_operation')
        .order('date_operation', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as JournalOperationSupabaseRow[]
    },
  })
}

export function useCreateJournalOperationSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      budgetLigneId: string; type: 'RECETTE' | 'DEPENSE' | 'VIREMENT';
      montant: number; dateOperation: string;
    }) => invokeEdgeFunction<{ data: unknown }>('journal-operations-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: journalOperationsSupabaseKeys.all }),
  })
}

export function useDeleteJournalOperationSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('journal-operations-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: journalOperationsSupabaseKeys.all }),
  })
}
