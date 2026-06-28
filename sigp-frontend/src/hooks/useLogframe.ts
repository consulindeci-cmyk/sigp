import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CadreLogique } from '@/types'

// MOCK DATA for Logframe
const mockLogframe: CadreLogique[] = [
  {
    id: 'lf-1',
    projet_id: 'proj-1',
    niveau_intervention: 'IMPACT',
    indicateur: 'Amélioration des conditions de vie',
    valeur_reference: '10%',
    cible: '50%',
    source_verification: 'Rapport national',
    hypotheses: 'Stabilité politique'
  },
  {
    id: 'lf-2',
    projet_id: 'proj-1',
    parent_id: 'lf-1',
    niveau_intervention: 'OBJECTIF',
    indicateur: 'Accès à l\'eau potable amélioré',
    valeur_reference: '20%',
    cible: '80%',
    source_verification: 'Enquête ménages'
  },
  {
    id: 'lf-3',
    projet_id: 'proj-1',
    parent_id: 'lf-2',
    niveau_intervention: 'RESULTAT',
    indicateur: 'Forages construits et fonctionnels',
    cible: '10 forages'
  },
  {
    id: 'lf-4',
    projet_id: 'proj-1',
    parent_id: 'lf-3',
    niveau_intervention: 'PRODUIT',
    indicateur: 'Equipements livrés',
    cible: '10 pompes'
  },
  {
    id: 'lf-5',
    projet_id: 'proj-1',
    parent_id: 'lf-4',
    niveau_intervention: 'ACTIVITE',
    indicateur: 'Creuser les puits',
  }
];

export function useLogframe(projectId: string) {
  return useQuery({
    queryKey: ['logframe', projectId],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { data: mockLogframe };
    },
    enabled: !!projectId,
  })
}

export function useCreateLogframe(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<CadreLogique>) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { id: `lf-new-${Date.now()}`, ...dto } as CadreLogique;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logframe', projectId] }),
  })
}

export function useUpdateLogframe(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<CadreLogique> & { id: string }) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { id, ...dto } as CadreLogique;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logframe', projectId] }),
  })
}

export function useDeleteLogframe(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (_id: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logframe', projectId] }),
  })
}
