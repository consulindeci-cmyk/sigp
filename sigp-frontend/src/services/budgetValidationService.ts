interface BudgetAvailabilityResponse {
  isAvailable: boolean;
  soldeDisponibleBase: number;
  message?: string;
}

const mockBudgetDatabase: Record<string, number> = {
  'bl-1': 5000000000,
  'bl-2': 150000000,
  'bl-3': 0,
};

export const budgetValidationService = {
  async checkBudgetAvailability(
    budgetLigneId: string,
    montantDemandeBase: number
  ): Promise<BudgetAvailabilityResponse> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const soldeDisponible = mockBudgetDatabase[budgetLigneId];

    if (soldeDisponible === undefined) {
      return { isAvailable: true, soldeDisponibleBase: 9_999_999_999 };
    }

    if (montantDemandeBase > soldeDisponible) {
      return {
        isAvailable: false,
        soldeDisponibleBase: soldeDisponible,
        message: `Dépassement budgétaire. Solde disponible : ${new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'XOF',
        }).format(soldeDisponible)}.`,
      };
    }

    return { isAvailable: true, soldeDisponibleBase: soldeDisponible };
  },

  async getSoldeDisponible(budgetLigneId: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return mockBudgetDatabase[budgetLigneId] ?? 0;
  },
};
