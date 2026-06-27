import { useState, useEffect } from 'react';

// Mocks internes temporaires pour l'Étape 4B
const mockAnalyticsData = {
  kpis: {
    tauxDecaissement: 45.2,
    burnRateMensuel: 150000,
    budgetRestant: 54.8
  },
  scurve: [
    { mois: 'Jan', prevu: 100, engage: 90, decaisse: 80 },
    { mois: 'Fév', prevu: 200, engage: 180, decaisse: 150 },
    { mois: 'Mar', prevu: 350, engage: 320, decaisse: 280 },
    { mois: 'Avr', prevu: 500, engage: 480, decaisse: 400 },
    { mois: 'Mai', prevu: 700, engage: 650, decaisse: 550 },
    { mois: 'Juin', prevu: 900, engage: 800, decaisse: 700 },
  ],
  burnRate: [
    { mois: 'Jan', depense: 80 },
    { mois: 'Fév', depense: 70 },
    { mois: 'Mar', depense: 130 },
    { mois: 'Avr', depense: 120 },
    { mois: 'Mai', depense: 150 },
    { mois: 'Juin', depense: 150 },
  ],
  heatmap: [
    { name: 'C1 - Infrastructures', 'Banque Mondiale': 85, 'AFD': 15 },
    { name: 'C2 - Renforcement Cap.', 'Banque Mondiale': 60, 'AFD': 40 },
    { name: 'C3 - Gestion Projet', 'Banque Mondiale': 100, 'AFD': 0 },
  ],
  sunburst: [
    { name: 'Banque Mondiale', value: 750 },
    { name: 'AFD', value: 250 },
    { name: 'État', value: 100 },
  ]
};

export function useBudgetAnalytics(versionId?: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    // Simulation d'un appel API asynchrone
    const timer = setTimeout(() => {
      if (mounted) {
        if (!versionId) {
          setData(null);
        } else {
          setData(mockAnalyticsData);
        }
        setIsLoading(false);
      }
    }, 800);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [versionId]);

  return {
    data,
    isLoading,
    error,
    isEmpty: !isLoading && !error && (!data || Object.keys(data).length === 0)
  };
}
