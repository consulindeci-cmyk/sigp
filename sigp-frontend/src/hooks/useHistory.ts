import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { HistoriqueProjet, PaginatedResponse } from '@/types';

export function useHistory(projectId: string) {
  return useQuery({
    queryKey: ['history', projectId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<HistoriqueProjet>>(
        `/projects/${projectId}/history`,
      );
      return data;
    },
    enabled: !!projectId,
  });
}

export interface HistoryStats {
  total:        number;
  aujourd_hui:  number;
  cette_semaine: number;
  exports:      number;
  alertes:      number;
}

export function useHistoryStats(entries: HistoriqueProjet[]): HistoryStats {
  return useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    const weekStart = (() => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().slice(0, 10);
    })();

    const today_count   = entries.filter(e => e.date === today).length;
    const week_count    = entries.filter(e => e.date >= weekStart).length;
    const exports_count = entries.filter(e =>
      e.action === 'EXPORT' || e.action === 'TELECHARGEMENT',
    ).length;
    const alertes_count = entries.filter(e =>
      e.niveau === 'CRITIQUE' || e.niveau === 'AVERTISSEMENT',
    ).length;

    return {
      total:         entries.length,
      aujourd_hui:   today_count,
      cette_semaine: week_count,
      exports:       exports_count,
      alertes:       alertes_count,
    };
  }, [entries]);
}
