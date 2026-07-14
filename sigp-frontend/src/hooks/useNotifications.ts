import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// ── Backend DTO (NestJS camelCase response) ───────────────────────────────────

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

// ── Cache keys ────────────────────────────────────────────────────────────────

export const notifKeys = {
  all: () => ['notifications'] as const,
};

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchNotifications(): Promise<NotificationDto[]> {
  const { data } = await api.get('/notifications', { params: { limit: 100 } });
  const raw = data?.data?.data ?? data?.data ?? data;
  return Array.isArray(raw) ? raw : [];
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
      api.patch(`/notifications/${id}`, { lue: true }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => api.patch(`/notifications/${id}`, { lue: true })));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: notifKeys.all() }),
  });
}
