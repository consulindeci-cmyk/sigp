import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { WBS, StatutWBS } from '@/types'

// MOCK DATA for WBS
const mockWBS: WBS[] = [
  {
    id: 'wbs-1',
    projet_id: 'proj-1',
    code_wbs: '1',
    titre: 'Composante 1 : Infrastructures',
    niveau: 1,
    ordre: 1,
    statut: 'EN_COURS',
    responsable: 'Jean Dupont',
    date_debut_prevue: '2024-01-01',
    date_fin_prevue: '2024-12-31',
  },
  {
    id: 'wbs-1-1',
    projet_id: 'proj-1',
    parent_id: 'wbs-1',
    code_wbs: '1.1',
    titre: 'Construction Bâtiment A',
    niveau: 2,
    ordre: 1,
    statut: 'EN_COURS',
    responsable: 'Alice Martin',
    budget_alloue: 500000,
    progression_physique: 40,
  },
  {
    id: 'wbs-1-2',
    projet_id: 'proj-1',
    parent_id: 'wbs-1',
    code_wbs: '1.2',
    titre: 'Construction Bâtiment B',
    niveau: 2,
    ordre: 2,
    statut: 'NON_COMMENCE',
    budget_alloue: 600000,
    progression_physique: 0,
  }
];

export function useWBS(projectId: string) {
  return useQuery({
    queryKey: ['wbs', projectId],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Calculate aggregations dynamically
      const aggregated = mockWBS.map(node => ({ ...node }));
      
      const getChildren = (parentId: string) => aggregated.filter(n => n.parent_id === parentId);
      
      const aggregate = (node: WBS) => {
        const children = getChildren(node.id);
        if (children.length > 0) {
          children.forEach(aggregate);
          node.budget_alloue = children.reduce((sum, child) => sum + (child.budget_alloue || 0), 0);
          node.progression_physique = children.reduce((sum, child) => sum + (child.progression_physique || 0), 0) / children.length;
        }
      };

      aggregated.filter(n => !n.parent_id).forEach(aggregate);
      
      return { data: aggregated };
    },
    enabled: !!projectId,
  })
}

export function useUpdateWBSOrder(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (items: {id: string, parent_id?: string | null, ordre: number}[]) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      // In a real app, send to API
      console.log('Update WBS Order:', items);
      return items;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wbs', projectId] }),
  })
}
