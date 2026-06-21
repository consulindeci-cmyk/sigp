import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { LigneBudgetaire } from '@/types'

// Types étendus pour le budget calculé par l'API
export interface BudgetLine {
  id: string;
  projet_id: string;
  code_budget: string;
  rubrique: string;
  sous_rubrique?: string;
  unite?: string;
  quantite: number;
  cout_unitaire: number;
  cout_total: number;
  financement_bailleur: number;
  contrepartie_etat: number;
  commentaire?: string;
  montant_engage: number;
  montant_decaisse: number;
  taux_consommation_pct: number;
  niveau_alerte: string;
}

export interface BudgetSummary {
  projet_id: string;
  budget_total: number;
  montant_engage: number;
  montant_decaisse: number;
  solde_disponible: number;
  taux_consommation_pct: number;
  consommation_par_rubrique: {
    rubrique: string;
    budget: number;
    engage: number;
    decaisse: number;
    taux_consommation_pct: number;
  }[];
}

export function useBudgetSummary(projectId: string) {
  return useQuery({
    queryKey: ['budget', 'summary', projectId],
    queryFn: async () => {
      const { data } = await api.get<BudgetSummary>(`/projects/${projectId}/budget/summary`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useBudgetLines(projectId: string) {
  return useQuery({
    queryKey: ['budget', 'lines', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ data: BudgetLine[], totaux: any }>(`/projects/${projectId}/budget`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateBudget(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<BudgetLine>) => {
      const { data } = await api.post<BudgetLine>(`/projects/${projectId}/budget`, dto)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget', 'summary', projectId] })
      qc.invalidateQueries({ queryKey: ['budget', 'lines', projectId] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
