// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Logframe (Objectives + Indicators) via Supabase.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const logframeSupabaseKeys = {
  objectivesAll: ['logframe-objectives-supabase'] as const,
  objectivesList: () => [...logframeSupabaseKeys.objectivesAll, 'list'] as const,
  indicatorsAll: ['logframe-indicators-supabase'] as const,
  indicatorsList: (objectiveId: string | null) => [...logframeSupabaseKeys.indicatorsAll, 'list', objectiveId] as const,
}

export type LogframeLevelSupabase = 'OBJECTIF_GLOBAL' | 'OBJECTIF_SPECIFIQUE' | 'RESULTAT' | 'ACTIVITE'
export type IndicatorTypeSupabase = 'IMPACT' | 'OUTCOME' | 'OUTPUT' | 'PROCESS'

export interface LogframeObjectiveSupabaseRow {
  id: string
  project_id: string
  niveau: LogframeLevelSupabase
  code: string
  libelle: string
  parent_id: string | null
  ordre: number
  actif: boolean
}

export interface LogframeIndicatorSupabaseRow {
  id: string
  objective_id: string
  code: string
  libelle: string
  type: IndicatorTypeSupabase
  valeur_baseline: number | null
  valeur_cible: number | null
  valeur_actuelle: number | null
}

export function useLogframeObjectivesSupabase() {
  return useQuery({
    queryKey: logframeSupabaseKeys.objectivesList(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logframe_objectives')
        .select('id, project_id, niveau, code, libelle, parent_id, ordre, actif')
        .order('ordre', { ascending: true })
        .limit(100)
      if (error) throw error
      return data as LogframeObjectiveSupabaseRow[]
    },
  })
}

export function useCreateLogframeObjectiveSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      projectId: string; niveau: LogframeLevelSupabase; code: string; libelle: string;
      parentId?: string; ordre?: number;
    }) => invokeEdgeFunction<{ data: unknown }>('logframe-objectives-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: logframeSupabaseKeys.objectivesAll }),
  })
}

export function useDeleteLogframeObjectiveSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('logframe-objectives-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: logframeSupabaseKeys.objectivesAll }),
  })
}

export function useLogframeIndicatorsSupabase(objectiveId: string | null) {
  return useQuery({
    queryKey: logframeSupabaseKeys.indicatorsList(objectiveId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logframe_indicators')
        .select('id, objective_id, code, libelle, type, valeur_baseline, valeur_cible, valeur_actuelle')
        .eq('objective_id', objectiveId as string)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as LogframeIndicatorSupabaseRow[]
    },
    enabled: !!objectiveId,
  })
}

export function useCreateLogframeIndicatorSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      objectiveId: string; code: string; libelle: string; type?: IndicatorTypeSupabase;
      valeurBaseline?: number; valeurCible?: number;
    }) => invokeEdgeFunction<{ data: unknown }>('logframe-indicators-create', payload),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: logframeSupabaseKeys.indicatorsList(variables.objectiveId) }),
  })
}

export function useDeleteLogframeIndicatorSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; objectiveId: string }) =>
      invokeEdgeFunction<{ message: string }>('logframe-indicators-delete', { id: payload.id }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: logframeSupabaseKeys.indicatorsList(variables.objectiveId) }),
  })
}
