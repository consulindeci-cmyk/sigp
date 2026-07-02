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

// ─────────────────────────────────────────────────────────────────────────────
// Version v2.0 — Budget révisé en cours (Brouillon, 4 lignes, 8.5M)
// ─────────────────────────────────────────────────────────────────────────────

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
    { mois: 'Déc', prevu: 8500000, engage: 7200000, decaisse: 5800000 },
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
    { name: 'Banque Mondiale', value: 5900000 },
    { name: 'AFD',             value: 2000000 },
    { name: 'État',            value: 600000  },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Version v1.0 — Budget initial approuvé (3 lignes, 7.55M)
// ─────────────────────────────────────────────────────────────────────────────

const mockBudgetAnalyticsV1: BudgetAnalyticsData = {
  kpis: {
    tauxDecaissement: 28.5,
    burnRateMensuel: 355000,
    budgetRestant: 5400000,
  },
  scurve: [
    { mois: 'Jan', prevu: 450000,  engage: 400000,  decaisse: 350000  },
    { mois: 'Fév', prevu: 700000,  engage: 650000,  decaisse: 550000  },
    { mois: 'Mar', prevu: 1050000, engage: 950000,  decaisse: 800000  },
    { mois: 'Avr', prevu: 1600000, engage: 1450000, decaisse: 1150000 },
    { mois: 'Mai', prevu: 2200000, engage: 2000000, decaisse: 1600000 },
    { mois: 'Jun', prevu: 2800000, engage: 2500000, decaisse: 2000000 },
    { mois: 'Jul', prevu: 3400000, engage: 3100000, decaisse: 2450000 },
    { mois: 'Aoû', prevu: 4000000, engage: 3600000, decaisse: 2900000 },
    { mois: 'Sep', prevu: 4700000, engage: 4200000, decaisse: 3350000 },
    { mois: 'Oct', prevu: 5400000, engage: 4800000, decaisse: 3850000 },
    { mois: 'Nov', prevu: 6100000, engage: 5400000, decaisse: 4300000 },
    { mois: 'Déc', prevu: 7550000, engage: 5800000, decaisse: 4700000 },
  ],
  burnRate: [
    { mois: 'Jan', depense: 350000 },
    { mois: 'Fév', depense: 200000 },
    { mois: 'Mar', depense: 250000 },
    { mois: 'Avr', depense: 350000 },
    { mois: 'Mai', depense: 450000 },
    { mois: 'Jun', depense: 400000 },
    { mois: 'Jul', depense: 450000 },
    { mois: 'Aoû', depense: 450000 },
    { mois: 'Sep', depense: 450000 },
    { mois: 'Oct', depense: 500000 },
    { mois: 'Nov', depense: 450000 },
    { mois: 'Déc', depense: 400000 },
  ],
  heatmap: [
    { name: 'Composante 1', Jan: 105000, Fév: 75000,  Mar: 125000, Avr: 165000, Mai: 185000, Jun: 155000 },
    { name: 'Composante 2', Jan: 65000,  Fév: 45000,  Mar: 75000,  Avr: 100000, Mai: 120000, Jun: 105000 },
    { name: 'UGP',          Jan: 28000,  Fév: 28000,  Mar: 28000,  Avr: 28000,  Mai: 28000,  Jun: 28000  },
  ],
  sunburst: [
    { name: 'Banque Mondiale', value: 5000000 },
    { name: 'AFD',             value: 2000000 },
    { name: 'État',            value: 550000  },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Lookup par versionId
// ─────────────────────────────────────────────────────────────────────────────

export const ANALYTICS_BY_VERSION: Record<string, BudgetAnalyticsData> = {
  'v1.0-1': mockBudgetAnalyticsV1,
  'v2.0-1': mockBudgetAnalytics,
};
