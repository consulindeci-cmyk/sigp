import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockWBS } from '@/mocks/wbsMock';
import type { WBS } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useWBS(projectId: string) {
  return useQuery({
    queryKey: ['wbs', projectId],
    queryFn: async () => {
      await delay(500);
      const aggregated = mockWBS.map(node => ({ ...node }));

      const getChildren = (parentId: string) => aggregated.filter(n => n.parent_id === parentId);

      const aggregate = (node: WBS) => {
        const children = getChildren(node.id);
        if (children.length > 0) {
          children.forEach(aggregate);
          node.budget_alloue = children.reduce((sum, child) => sum + (child.budget_alloue || 0), 0);
          node.progression_physique =
            children.reduce((sum, child) => sum + (child.progression_physique || 0), 0) / children.length;
        }
      };

      aggregated.filter(n => !n.parent_id).forEach(aggregate);

      return { data: aggregated };
    },
    enabled: !!projectId,
  });
}

export function useUpdateWBSOrder(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; parent_id?: string | null; ordre: number }[]) => {
      await delay(300);
      return items;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wbs', projectId] }),
  });
}
