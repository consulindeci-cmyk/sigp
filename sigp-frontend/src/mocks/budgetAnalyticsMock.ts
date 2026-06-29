export interface BudgetAnalyticsData {
  kpis: {
    tauxDecaissement: number;
    burnRateMensuel: number;
    budgetRestant: number;
  };
  scurve: Array<{ mois: string; prevu: number; engage: number; decaisse: number }>;
  burnRate: Array<{ mois: string; depense: number }>;
  heatmap: Array<{ name: string; [key: string]: string | number }>;
  sunburst: Array<{ name: string; value: number }>;
}

export const mockBudgetAnalytics: BudgetAnalyticsData = {
  kpis: {
    tauxDecaissement: 34.2,
    burnRateMensuel: 425000,
    budgetRestant: 4950000,
  },
  scurve: [
    { mois: 'Jan', prevu: 500000,  engage: 450000,  decaisse: 400000  },
    { mois: 'Fév', prevu: 800000,  engage: 750000,  decaisse: 650000  },
    { mois: 'Mar', prevu: 1200000, engage: 1100000, decaisse: 950000  },
    { mois: 'Avr', prevu: 1800000, engage: 1700000, decaisse: 1400000 },
    { mois: 'Mai', prevu: 2500000, engage: 2300000, decaisse: 1900000 },
    { mois: 'Jun', prevu: 3100000, engage: 2900000, decaisse: 2400000 },
    { mois: 'Jul', prevu: 3800000, engage: 3500000, decaisse: 2900000 },
    { mois: 'Aoû', prevu: 4600000, engage: 4200000, decaisse: 3500000 },
    { mois: 'Sep', prevu: 5400000, engage: 5000000, decaisse: 4100000 },
    { mois: 'Oct', prevu: 6100000, engage: 5600000, decaisse: 4700000 },
    { mois: 'Nov', prevu: 6900000, engage: 6300000, decaisse: 5300000 },
    { mois: 'Déc', prevu: 7550000, engage: 6900000, decaisse: 5800000 },
  ],
  burnRate: [
    { mois: 'Jan', depense: 400000  },
    { mois: 'Fév', depense: 250000  },
    { mois: 'Mar', depense: 300000  },
    { mois: 'Avr', depense: 450000  },
    { mois: 'Mai', depense: 500000  },
    { mois: 'Jun', depense: 500000  },
    { mois: 'Jul', depense: 500000  },
    { mois: 'Aoû', depense: 600000  },
    { mois: 'Sep', depense: 600000  },
    { mois: 'Oct', depense: 600000  },
    { mois: 'Nov', depense: 600000  },
    { mois: 'Déc', depense: 500000  },
  ],
  heatmap: [
    { name: 'Composante 1', Jan: 120000, Fév: 90000,  Mar: 150000, Avr: 200000, Mai: 220000, Jun: 180000 },
    { name: 'Composante 2', Jan: 80000,  Fév: 60000,  Mar: 90000,  Avr: 120000, Mai: 150000, Jun: 130000 },
    { name: 'Composante 3', Jan: 50000,  Fév: 40000,  Mar: 60000,  Avr: 80000,  Mai: 90000,  Jun: 80000  },
    { name: 'UGP',          Jan: 30000,  Fév: 30000,  Mar: 30000,  Avr: 30000,  Mai: 30000,  Jun: 30000  },
  ],
  sunburst: [
    { name: 'Banque Mondiale', value: 5000000 },
    { name: 'AFD',             value: 2000000 },
    { name: 'État',            value: 550000  },
  ],
};
