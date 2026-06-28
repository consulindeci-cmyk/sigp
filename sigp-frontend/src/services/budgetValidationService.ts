import api from '@/lib/axios';

interface BudgetAvailabilityResponse {
  isAvailable: boolean;
  soldeDisponibleBase: number;
  message?: string;
}

export const budgetValidationService = {
  async checkBudgetAvailability(budgetLigneId: string, montantDemandeBase: number): Promise<BudgetAvailabilityResponse> {
    const { data } = await api.get<BudgetAvailabilityResponse>(
      `/budget/lignes/${budgetLigneId}/disponibilite`,
      { params: { montant: montantDemandeBase } }
    );
    return data;
  },

  async getSoldeDisponible(budgetLigneId: string): Promise<number> {
    const { data } = await api.get<{ soldeDisponibleBase: number }>(
      `/budget/lignes/${budgetLigneId}/disponibilite`
    );
    return data.soldeDisponibleBase;
  },
};
