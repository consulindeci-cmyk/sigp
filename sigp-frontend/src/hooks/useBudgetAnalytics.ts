import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import api from '@/lib/axios';

interface BudgetAnalyticsData {
  kpis: {
    tauxDecaissement: number;
    burnRateMensuel: number;
    budgetRestant: number;
  };
  scurve: Array<{ mois: string; prevu: number; engage: number; decaisse: number }>;
  burnRate: Array<{ mois: string; depense: number }>;
  heatmap: Array<{ name: string; [key: string]: string | number }>;
  sunburst: Array<{ name: string; value: number }>;
}

export function useBudgetAnalytics(versionId?: string) {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const query = useQuery({
    queryKey: ['budget-analytics', resolvedProjectId, versionId],
    queryFn: async (): Promise<BudgetAnalyticsData> => {
      const { data } = await api.get<BudgetAnalyticsData>(
        `/projects/${resolvedProjectId}/budget/analytics`,
        { params: versionId ? { versionId } : undefined }
      );
      return data;
    },
    enabled: !!resolvedProjectId && !!versionId,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isEmpty: !query.isLoading && !query.error && !query.data,
  };
}
