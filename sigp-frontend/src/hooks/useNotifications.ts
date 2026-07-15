import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';

// ── Types (inchangés) ──────────────────────────────────────────────────────────

export type TypeNotification =
  | 'RISQUE_CRITIQUE'
  | 'LIVRABLE_EN_RETARD'
  | 'BUDGET_DEPASSE'
  | 'EVM_ALERTE_CPI'
  | 'EVM_ALERTE_SPI'
  | 'DOCUMENT_VALIDE'
  | 'RAPPORT_PRET'
  | 'MENTION_COMMENTAIRE'
  | 'PROJET_STATUT_CHANGE'
  | 'BUDGET_VALIDE'
  | 'CONTRAT_EXPIRE'
  | 'PAIEMENT_DU';

export interface NotificationDto {
  id:         string;
  userId:     string;
  projectId:  string | null;
  type:       TypeNotification;
  titre:      string;
  message:    string;
  lue:        boolean;
  data:       Record<string, unknown> | null;
  expiresAt:  string | null;
  createdBy:  string | null;
  updatedBy:  string | null;
  createdAt:  string;
  updatedAt:  string;
}

// ── Ligne Supabase (colonnes snake_case) — RLS filtre déjà sur l'utilisateur ──
// courant (policy notifications_select : user_id = current_app_user_id()),
// pas besoin de filtre explicite ici.

interface NotificationRow {
  id: string;
  user_id: string;
  project_id: string | null;
  type: TypeNotification;
  titre: string;
  message: string;
  lue: boolean;
  data: Record<string, unknown> | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const NOTIFICATION_SELECT = 'id, user_id, project_id, type, titre, message, lue, data, expires_at, created_at, updated_at';

function adaptNotification(row: NotificationRow): NotificationDto {
  return {
    id:        row.id,
    userId:    row.user_id,
    projectId: row.project_id,
    type:      row.type,
    titre:     row.titre,
    message:   row.message,
    lue:       row.lue,
    data:      row.data,
    expiresAt: row.expires_at,
    createdBy: null,
    updatedBy: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Cache keys ────────────────────────────────────────────────────────────────

export const notifKeys = {
  all: () => ['notifications'] as const,
};

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchNotifications(): Promise<NotificationDto[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as NotificationRow[]).map(adaptNotification);
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey:       notifKeys.all(),
    queryFn:        fetchNotifications,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      invokeEdgeFunction<{ data: NotificationRow }>('notifications-update', { id, lue: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => invokeEdgeFunction<{ data: NotificationRow }>('notifications-update', { id, lue: true })));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('notifications-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
  });
}
