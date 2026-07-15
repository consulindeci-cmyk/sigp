// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Livrables / Jalons via Supabase (6e module de la Phase 2).
// "Jalon" = Livrable avec une date_prevue à venir (pas de table dédiée).
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const livrablesSupabaseKeys = {
  all: ['livrables-supabase'] as const,
  list: () => [...livrablesSupabaseKeys.all, 'list'] as const,
}

export interface LivrableSupabaseRow {
  id: string
  project_id: string
  nom: string
  statut: string
  date_prevue: string | null
}

export function useLivrablesSupabase() {
  return useQuery({
    queryKey: livrablesSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livrables')
        .select('id, project_id, nom, statut, date_prevue')
        .order('date_prevue', { ascending: true, nullsFirst: false })
        .limit(100)
      if (error) throw error
      return data as LivrableSupabaseRow[]
    },
  })
}

export function useCreateLivrableSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      projectId: string; nom: string; datePrevue?: string;
      statut?: 'NON_COMMENCE' | 'EN_COURS' | 'SOUMIS' | 'EN_REVISION' | 'VALIDE' | 'REJETE' | 'EN_RETARD';
    }) => invokeEdgeFunction<{ data: unknown }>('livrables-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: livrablesSupabaseKeys.all }),
  })
}

export function useDeleteLivrableSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('livrables-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: livrablesSupabaseKeys.all }),
  })
}
