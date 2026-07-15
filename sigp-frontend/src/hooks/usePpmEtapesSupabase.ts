// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module PPM-Étapes via Supabase.
// Table sans deleted_at ni created_by/updated_by — suppression = DELETE réel.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const ppmEtapesSupabaseKeys = {
  all: ['ppm-etapes-supabase'] as const,
  list: (marcheId: string | null) => [...ppmEtapesSupabaseKeys.all, 'list', marcheId] as const,
}

export interface PpmEtapeSupabaseRow {
  id: string
  marche_id: string
  libelle: string
  ordre: number
  complete: boolean
}

export function usePpmEtapesSupabase(marcheId: string | null) {
  return useQuery({
    queryKey: ppmEtapesSupabaseKeys.list(marcheId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ppm_etapes')
        .select('id, marche_id, libelle, ordre, complete')
        .eq('marche_id', marcheId as string)
        .order('ordre', { ascending: true })
      if (error) throw error
      return data as PpmEtapeSupabaseRow[]
    },
    enabled: !!marcheId,
  })
}

export function useCreatePpmEtapeSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { marcheId: string; libelle: string; ordre: number }) =>
      invokeEdgeFunction<{ data: unknown }>('ppm-etapes-create', payload),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ppmEtapesSupabaseKeys.list(variables.marcheId) }),
  })
}

export function useDeletePpmEtapeSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; marcheId: string }) =>
      invokeEdgeFunction<{ message: string }>('ppm-etapes-delete', { id: payload.id }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ppmEtapesSupabaseKeys.list(variables.marcheId) }),
  })
}
