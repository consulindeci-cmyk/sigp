import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { EvmIndicateurs, EvmTache } from '@/types';

// =========================================================================
// OLD HOOKS (Keep for backward compatibility with MoteurEVMPage)
// =========================================================================
export function useEvm(projectId: string, dateControle?: string) {
  return useQuery({
    queryKey: ['evm', projectId, dateControle],
    queryFn: async () => {
      const params = dateControle ? { dateControle } : {};
      const { data } = await api.get<EvmIndicateurs>(`/projects/${projectId}/evm`, { params });
      return data;
    },
    enabled: !!projectId,

  });
}

export function useEvmTasks(projectId: string, dateControle?: string) {
  return useQuery({
    queryKey: ['evm-tasks', projectId, dateControle],
    queryFn: async () => {
      const params = dateControle ? { dateControle } : {};
      const { data } = await api.get<EvmTache[]>(`/projects/${projectId}/evm/tasks`, { params });
      return data;
    },
    enabled: !!projectId,

  });
}

export function useEvmTrend(projectId: string) {
  return useQuery({
    queryKey: ['evm-trend', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/evm/trend`);
      return data as { projet_id: string; evolution_mensuelle: Array<{ mois: string; pv: number; ev: number; ac: number }> };
    },
    enabled: !!projectId,

  });
}

// =========================================================================
// NEW HOOKS (Sprint H)
// =========================================================================

export interface EvmSummary {
  pv: number;
  ev: number;
  ac: number;
  sv: number;
  cv: number;
  spi: number;
  cpi: number;
  eac: number;
  etc: number;
  vac: number;
}

export interface EvmHistoryPoint {
  periode: string;
  pv: number;
  ev: number;
  ac: number;
}

export const useProjectEvmSummary = (projectId: string) => {
  return useQuery<EvmSummary>({
    queryKey: ['projects', projectId, 'evm', 'summary'],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/evm/summary`);
      return data;
    },
    enabled: !!projectId,

    refetchOnWindowFocus: false,
  });
};

export const useProjectEvmHistory = (projectId: string) => {
  return useQuery<EvmHistoryPoint[]>({
    queryKey: ['projects', projectId, 'evm', 'history'],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/evm/history`);
      return data;
    },
    enabled: !!projectId,

    refetchOnWindowFocus: false,
  });
};
