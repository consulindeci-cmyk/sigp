import { useQuery } from '@tanstack/react-query';
import { ANALYTICS_BY_VERSION, mockBudgetAnalytics } from '@/mocks/budgetAnalyticsMock';
import type { BudgetAnalyticsData } from '@/mocks/budgetAnalyticsMock';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useBudgetAnalytics(versionId?: string) {
  const query = useQuery<BudgetAnalyticsData>({
    queryKey: ['budget-analytics', versionId],
    queryFn: async () => {
      await delay(700);
      return ANALYTICS_BY_VERSION[versionId ?? ''] ?? mockBudgetAnalytics;
    },
    enabled: !!versionId,
  });

  return {
    data:      query.data ?? null,
    isLoading: query.isLoading,
    error:     query.error,
    isEmpty:   !query.isLoading && !query.error && !query.data,
    refetch:   query.refetch,
  };
}
