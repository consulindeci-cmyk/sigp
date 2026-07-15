// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Risques via Supabase (2e module de la Phase 2).
// Même pattern que useProjectsSupabase.ts : isolé, ne touche à rien de
// l'existant (useRisks.ts / NestJS reste intact).
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const risquesSupabaseKeys = {
  all: ['risques-supabase'] as const,
  list: () => [...risquesSupabaseKeys.all, 'list'] as const,
}

export interface RisqueSupabaseRow {
  id: string
  project_id: string
  code: string | null
  description: string
  categorie: string | null
  probabilite: string
  impact: string
  niveau_criticite: string
  statut: string
}

export function useRisquesSupabase() {
  return useQuery({
    queryKey: risquesSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('risques')
        .select('id, project_id, code, description, categorie, probabilite, impact, niveau_criticite, statut')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as RisqueSupabaseRow[]
    },
  })
}

export function useCreateRisqueSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      projectId: string; description: string;
      probabilite: 'FAIBLE' | 'POSSIBLE' | 'PROBABLE' | 'QUASI_CERTAIN';
      impact: 'FAIBLE' | 'MODERE' | 'IMPORTANT' | 'CRITIQUE';
      code?: string; categorie?: string;
    }) => invokeEdgeFunction<{ data: unknown }>('risques-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: risquesSupabaseKeys.all }),
  })
}

export function useDeleteRisqueSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('risques-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: risquesSupabaseKeys.all }),
  })
}
