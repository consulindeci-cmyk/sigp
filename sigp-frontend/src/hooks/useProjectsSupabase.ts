// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Projets via Supabase (auth + data + Edge Functions).
// Fichier isolé, volontairement séparé de `useProjects.ts` (NestJS) : ne touche
// à rien de l'existant. À utiliser uniquement avec le compte de test Supabase
// Auth pendant la phase de validation — pas encore branché sur `ProjectsPage`.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'
import type { ProjectApiDto } from '@/lib/projectAdapter'

export const projectsSupabaseKeys = {
  all: ['projects-supabase'] as const,
  list: () => [...projectsSupabaseKeys.all, 'list'] as const,
}

// Colonnes aliasées en camelCase pour matcher exactement ProjectApiDto —
// adaptProjectDto() et tout le reste de l'UI existante fonctionnent sans
// modification une fois qu'on branchera ce hook à la place de useProjects().
const PROJECT_SELECT = `
  id, code, nom, description, statut,
  bailleurPrincipal:bailleur_principal,
  secteur, pays,
  managerId:manager_id,
  programmeId:programme_id,
  budgetTotal:budget_total,
  devise,
  dateDebut:date_debut,
  dateFinPrevue:date_fin_prevue,
  dateFinEffective:date_fin_effective,
  dateClotureEffective:date_cloture_effective,
  createdAt:created_at,
  updatedAt:updated_at,
  manager:users!manager_id(nom, prenom)
`

type RawRow = ProjectApiDto & { manager: { nom: string; prenom: string } | null }

function flatten(row: RawRow): ProjectApiDto {
  const { manager, ...rest } = row
  return {
    ...rest,
    managerNom: manager?.nom ?? null,
    managerPrenom: manager?.prenom ?? null,
  }
}

export function useProjectsSupabase() {
  return useQuery({
    queryKey: projectsSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return (data as unknown as RawRow[]).map(flatten)
    },
  })
}

export function useCreateProjectSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      code: string; nom: string; programmeId: string; description?: string;
      statut?: string; managerId?: string; dateDebut?: string; dateFinPrevue?: string;
      budgetTotal?: number; devise?: string; pays?: string; secteur?: string;
      bailleurPrincipal?: string;
    }) => invokeEdgeFunction<{ data: unknown }>('projects-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsSupabaseKeys.all }),
  })
}

export function useUpdateProjectSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string } & Record<string, unknown>) =>
      invokeEdgeFunction<{ data: unknown }>('projects-update', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsSupabaseKeys.all }),
  })
}

export function useDeleteProjectSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('projects-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsSupabaseKeys.all }),
  })
}
