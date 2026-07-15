// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module WBS via Supabase (3e module de la Phase 2).
// Même pattern que useProjectsSupabase.ts / useRisksSupabase.ts : isolé, ne
// touche à rien de l'existant.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const wbsSupabaseKeys = {
  all: ['wbs-supabase'] as const,
  list: () => [...wbsSupabaseKeys.all, 'list'] as const,
}

export interface WbsNodeSupabaseRow {
  id: string
  project_id: string
  parent_id: string | null
  code: string
  libelle: string
  type: string
  niveau: number
  ordre: number
}

export function useWbsNodesSupabase() {
  return useQuery({
    queryKey: wbsSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wbs_nodes')
        .select('id, project_id, parent_id, code, libelle, type, niveau, ordre')
        .order('niveau', { ascending: true })
        .order('ordre', { ascending: true })
        .limit(200)
      if (error) throw error
      return data as WbsNodeSupabaseRow[]
    },
  })
}

export function useCreateWbsNodeSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      projectId: string; code: string; libelle: string;
      type: 'PHASE' | 'LOT' | 'ACTIVITE' | 'LIVRABLE';
      parentId?: string; objectiveId?: string; ordre?: number;
    }) => invokeEdgeFunction<{ data: unknown }>('wbs-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: wbsSupabaseKeys.all }),
  })
}

export function useDeleteWbsNodeSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('wbs-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: wbsSupabaseKeys.all }),
  })
}
