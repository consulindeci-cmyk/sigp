import { useQuery } from '@tanstack/react-query';
import { mockBudgetAnalytics } from '@/mocks/budgetAnalyticsMock';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useBudgetAnalytics(versionId?: string) {
  const query = useQuery({
    queryKey: ['budget-analytics', versionId],
    queryFn: async () => {
      await delay(700);
      return mockBudgetAnalytics;
    },
    enabled: !!versionId,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isEmpty: !query.isLoading && !query.error && !query.data,
  };
}
