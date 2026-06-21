import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface JournalOperation {
  id: string;
  id_journal: string;
  date: string;
  wbs: string;
  description: string;
  ligne_budgetaire: string;
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  prevu: number;
  engage: number;
  decaisse: number;
  ecart: number;
}

export interface JournalData {
  kpis: {
    operationsCount: number;
    prevuTotal: number;
    engageTotal: number;
    decaisseTotal: number;
  };
  operations: JournalOperation[];
}

export const useJournal = (projectId: string) => {
  return useQuery({
    queryKey: ['projects', projectId, 'journal'],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await api.get<JournalData>(`/projects/${projectId}/journal`);
      return data;
    },
    enabled: !!projectId,
  });
};
