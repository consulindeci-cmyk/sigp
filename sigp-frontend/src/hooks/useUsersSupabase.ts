// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Users/RBAC via Supabase. mot_de_passe n'est JAMAIS
// sélectionné ici : RLS protège les lignes, pas les colonnes.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const usersSupabaseKeys = {
  all: ['users-supabase'] as const,
  list: () => [...usersSupabaseKeys.all, 'list'] as const,
}

export type UserRoleSupabase = 'ADMIN' | 'COORDINATEUR' | 'CHARGE_PROGRAMME' | 'FINANCIER' | 'AUDITEUR' | 'VIEWER'

export interface UserSupabaseRow {
  id: string
  nom: string
  prenom: string
  email: string
  role: UserRoleSupabase
  actif: boolean
  telephone: string | null
  organisation_id: string | null
}

export function useUsersSupabase() {
  return useQuery({
    queryKey: usersSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, nom, prenom, email, role, actif, telephone, organisation_id')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as UserSupabaseRow[]
    },
  })
}

export function useCreateUserSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      nom: string; prenom: string; email: string; password: string;
      role?: UserRoleSupabase; telephone?: string; organisationId?: string;
    }) => invokeEdgeFunction<{ data: unknown; warning?: string }>('users-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersSupabaseKeys.all }),
  })
}

export function useUpdateUserSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; nom?: string; prenom?: string; telephone?: string; role?: UserRoleSupabase; actif?: boolean }) =>
      invokeEdgeFunction<{ data: unknown }>('users-update', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersSupabaseKeys.all }),
  })
}

export function useDeleteUserSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('users-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersSupabaseKeys.all }),
  })
}
