// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module PTBA (activités du plan de travail budget annuel) via Supabase.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const ptbaSupabaseKeys = {
  all: ['ptba-supabase'] as const,
  list: () => [...ptbaSupabaseKeys.all, 'list'] as const,
}

export type PtbaStatutSupabase = 'NON_DEMARRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'EN_RETARD'

export interface PtbaActiviteSupabaseRow {
  id: string
  project_id: string
  wbs_id: string | null
  logframe_ref_id: string | null
  code: string
  libelle: string
  statut: PtbaStatutSupabase
  annee: number
  trimestre: number
  montant_prevu: number | null
  montant_realise: number | null
}

export function usePtbaActivitesSupabase() {
  return useQuery({
    queryKey: ptbaSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ptba_activites')
        .select('id, project_id, wbs_id, logframe_ref_id, code, libelle, statut, annee, trimestre, montant_prevu, montant_realise')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as PtbaActiviteSupabaseRow[]
    },
  })
}

export function useCreatePtbaActiviteSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      projectId: string; code: string; libelle: string; annee: number; trimestre: number;
      wbsId?: string; logframeIndicatorId?: string;
    }) => invokeEdgeFunction<{ data: unknown }>('ptba-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ptbaSupabaseKeys.all }),
  })
}

export function useDeletePtbaActiviteSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('ptba-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ptbaSupabaseKeys.all }),
  })
}
