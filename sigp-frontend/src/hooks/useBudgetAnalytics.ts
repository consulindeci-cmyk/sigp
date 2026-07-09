import { useQuery } from '@tanstack/react-query';
import { ANALYTICS_BY_VERSION, mockBudgetAnalytics } from '@/mocks/budgetAnalyticsMock';
import type { BudgetAnalyticsData } from '@/mocks/budgetAnalyticsMock';

// No dedicated analytics endpoint exists in the backend — data is derived from
// local budget lines computed in BudgetAnalyticsDashboard. Mock data is used
// as a fallback until a real endpoint is available.
export function useBudgetAnalytics(versionId?: string) {
  const query = useQuery<BudgetAnalyticsData>({
    queryKey: ['budget-analytics', versionId],
    queryFn: async () => {
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
