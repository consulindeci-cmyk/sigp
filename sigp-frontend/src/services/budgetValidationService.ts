/**
 * Service métier partagé chargé des règles budgétaires (PPM, Contrats, Décaissements).
 * Implémentation isolée pour éviter la duplication de la logique financière.
 */

interface BudgetAvailabilityResponse {
  isAvailable: boolean;
  soldeDisponibleBase: number;
  message?: string;
}

// Mock des budgets disponibles par ligne budgétaire pour la phase de dev
const mockBudgetDatabase: Record<string, number> = {
  'bl-1': 5000000000, // 5 Milliards XOF
  'bl-2': 150000000,  // 150 Millions XOF
  'bl-3': 0           // Ligne épuisée
};

export const budgetValidationService = {
  /**
   * Vérifie si le montant demandé ne dépasse pas le solde disponible de la ligne budgétaire.
   * Utilise une API asynchrone pour être compatible avec la future intégration backend.
   * 
   * @param budgetLigneId - L'identifiant de la ligne budgétaire
   * @param montantDemandeBase - Le montant estimé en monnaie de base (XOF)
   */
  async checkBudgetAvailability(budgetLigneId: string, montantDemandeBase: number): Promise<BudgetAvailabilityResponse> {
    // Simule la latence réseau
    await new Promise(resolve => setTimeout(resolve, 300));

    const soldeDisponible = mockBudgetDatabase[budgetLigneId];

    if (soldeDisponible === undefined) {
      return {
        isAvailable: false,
        soldeDisponibleBase: 0,
        message: "Ligne budgétaire introuvable."
      };
    }

    if (montantDemandeBase > soldeDisponible) {
      return {
        isAvailable: false,
        soldeDisponibleBase: soldeDisponible,
        message: `Dépassement budgétaire. Solde disponible: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(soldeDisponible)}.`
      };
    }

    return {
      isAvailable: true,
      soldeDisponibleBase: soldeDisponible
    };
  },
  
  /**
   * Retourne le solde disponible pour une ligne budgétaire (utilisé pour affichage UI).
   */
  async getSoldeDisponible(budgetLigneId: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return mockBudgetDatabase[budgetLigneId] || 0;
  }
};
