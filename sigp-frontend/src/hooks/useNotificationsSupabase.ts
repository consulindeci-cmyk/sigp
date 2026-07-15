// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Notifications via Supabase.
// CRUD fidèle à l'existant NestJS (pas d'automatisation — voir mémoire projet :
// aucun @OnEvent n'a jamais consommé les événements métier, donc rien à
// reproduire au-delà du CRUD manuel).
// Scoping PAR UTILISATEUR (pas par organisation, contrairement aux 9 modules
// précédents) : chacun ne voit que ses propres notifications.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const notificationsSupabaseKeys = {
  all: ['notifications-supabase'] as const,
  list: () => [...notificationsSupabaseKeys.all, 'list'] as const,
}

export interface NotificationSupabaseRow {
  id: string
  user_id: string
  type: string
  titre: string
  message: string
  lue: boolean
}

export function useNotificationsSupabase() {
  return useQuery({
    queryKey: notificationsSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, titre, message, lue')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as NotificationSupabaseRow[]
    },
  })
}

export function useCreateNotificationSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { userId: string; type: string; titre: string; message: string }) =>
      invokeEdgeFunction<{ data: unknown }>('notifications-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsSupabaseKeys.all }),
  })
}

export function useMarkNotificationReadSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ data: unknown }>('notifications-update', { id, lue: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsSupabaseKeys.all }),
  })
}

export function useDeleteNotificationSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('notifications-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsSupabaseKeys.all }),
  })
}
