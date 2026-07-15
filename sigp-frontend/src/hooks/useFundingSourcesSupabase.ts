// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Funding Sources via Supabase (chantier Budget, 3/5).
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const fundingSourcesSupabaseKeys = {
  all: ['funding-sources-supabase'] as const,
  list: () => [...fundingSourcesSupabaseKeys.all, 'list'] as const,
}

export interface FundingSourceSupabaseRow {
  id: string
  project_id: string
  nom: string
  type: string
  montant: number
  devise: string
}

export function useFundingSourcesSupabase() {
  return useQuery({
    queryKey: fundingSourcesSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funding_sources')
        .select('id, project_id, nom, type, montant, devise')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as FundingSourceSupabaseRow[]
    },
  })
}

export function useCreateFundingSourceSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      projectId: string; nom: string; montant: number;
      type?: 'BAILLEUR' | 'CONTREPARTIE_NATIONALE' | 'AUTRE';
    }) => invokeEdgeFunction<{ data: unknown }>('funding-sources-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: fundingSourcesSupabaseKeys.all }),
  })
}

export function useDeleteFundingSourceSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('funding-sources-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: fundingSourcesSupabaseKeys.all }),
  })
}
