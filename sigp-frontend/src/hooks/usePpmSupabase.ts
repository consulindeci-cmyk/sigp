// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module PPM (marchés publics) via Supabase.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const ppmSupabaseKeys = {
  all: ['ppm-supabase'] as const,
  list: () => [...ppmSupabaseKeys.all, 'list'] as const,
}

export interface PpmMarcheSupabaseRow {
  id: string
  project_id: string
  code: string
  intitule: string
  type: string
  statut: string
}

export function usePpmMarchesSupabase() {
  return useQuery({
    queryKey: ppmSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ppm_marches')
        .select('id, project_id, code, intitule, type, statut')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as PpmMarcheSupabaseRow[]
    },
  })
}

export function useCreatePpmMarcheSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      projectId: string; code: string; intitule: string;
      type: 'FOURNITURES' | 'TRAVAUX' | 'SERVICES' | 'CONSULTANTS';
    }) => invokeEdgeFunction<{ data: unknown }>('ppm-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ppmSupabaseKeys.all }),
  })
}

export function useDeletePpmMarcheSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('ppm-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ppmSupabaseKeys.all }),
  })
}
