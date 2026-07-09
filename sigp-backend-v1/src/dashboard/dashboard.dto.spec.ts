import { DashboardProjectDto } from './dto/dashboard-project.dto';
import { DashboardFinanceDto } from './dto/dashboard-finance.dto';
import { DashboardRiskDto } from './dto/dashboard-risk.dto';
import { DashboardProcurementDto } from './dto/dashboard-procurement.dto';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

// ─── DashboardProjectDto ─────────────────────────────────────────────────────

describe('DashboardProjectDto', () => {
  it('holds total, actifs, termines, suspendus', () => {
    const dto: DashboardProjectDto = { total: 10, actifs: 5, termines: 3, suspendus: 2 };
    expect(dto.total).toBe(10);
    expect(dto.actifs).toBe(5);
    expect(dto.termines).toBe(3);
    expect(dto.suspendus).toBe(2);
  });

  it('accepts zero values', () => {
    const dto: DashboardProjectDto = { total: 0, actifs: 0, termines: 0, suspendus: 0 };
    expect(dto.total).toBe(0);
  });

  it('actifs can exceed total (independent counts)', () => {
    const dto: DashboardProjectDto = { total: 5, actifs: 5, termines: 0, suspendus: 0 };
    expect(dto.actifs).toBe(5);
  });
});

// ─── DashboardFinanceDto ─────────────────────────────────────────────────────

describe('DashboardFinanceDto', () => {
  it('holds all financial fields', () => {
    const dto: DashboardFinanceDto = {
      budgetTotal: 500000,
      montantEngage: 200000,
      montantPaye: 150000,
      montantRestant: 350000,
      nombreVersions: 3,
      nombreLignes: 42,
    };
    expect(dto.budgetTotal).toBe(500000);
    expect(dto.montantEngage).toBe(200000);
    expect(dto.montantPaye).toBe(150000);
    expect(dto.montantRestant).toBe(350000);
    expect(dto.nombreVersions).toBe(3);
    expect(dto.nombreLignes).toBe(42);
  });

  it('accepts zero amounts', () => {
    const dto: DashboardFinanceDto = {
      budgetTotal: 0,
      montantEngage: 0,
      montantPaye: 0,
      montantRestant: 0,
      nombreVersions: 0,
      nombreLignes: 0,
    };
    expect(dto.budgetTotal).toBe(0);
    expect(dto.montantRestant).toBe(0);
  });

  it('montantRestant can be zero when budgetTotal equals montantPaye', () => {
    const dto: DashboardFinanceDto = {
      budgetTotal: 1000,
      montantEngage: 500,
      montantPaye: 1000,
      montantRestant: 0,
      nombreVersions: 1,
      nombreLignes: 5,
    };
    expect(dto.montantRestant).toBe(0);
  });
});

// ─── DashboardRiskDto ────────────────────────────────────────────────────────

describe('DashboardRiskDto', () => {
  it('holds total, critiques, eleves', () => {
    const dto: DashboardRiskDto = { total: 20, critiques: 4, eleves: 7 };
    expect(dto.total).toBe(20);
    expect(dto.critiques).toBe(4);
    expect(dto.eleves).toBe(7);
  });

  it('accepts zero critiques and eleves', () => {
    const dto: DashboardRiskDto = { total: 5, critiques: 0, eleves: 0 };
    expect(dto.critiques).toBe(0);
    expect(dto.eleves).toBe(0);
  });
});

// ─── DashboardProcurementDto ─────────────────────────────────────────────────

describe('DashboardProcurementDto', () => {
  it('holds marchesTotal, marchesTermines, marchesEnCours, etapesTotal', () => {
    const dto: DashboardProcurementDto = {
      marchesTotal: 10,
      marchesTermines: 3,
      marchesEnCours: 7,
      etapesTotal: 45,
    };
    expect(dto.marchesTotal).toBe(10);
    expect(dto.marchesTermines).toBe(3);
    expect(dto.marchesEnCours).toBe(7);
    expect(dto.etapesTotal).toBe(45);
  });

  it('accepts all-zero state', () => {
    const dto: DashboardProcurementDto = {
      marchesTotal: 0,
      marchesTermines: 0,
      marchesEnCours: 0,
      etapesTotal: 0,
    };
    expect(dto.marchesEnCours).toBe(0);
  });
});

// ─── DashboardOverviewDto ────────────────────────────────────────────────────

describe('DashboardOverviewDto', () => {
  it('holds all PTBA fields', () => {
    const dto: DashboardOverviewDto = {
      ptbaTotal: 30,
      ptbaTermines: 12,
      ptbaEnCours: 10,
      ptbaNonDemarres: 8,
      livrablesTotal: 25,
      livrablesValides: 15,
      livrablesSoumis: 5,
      documentsTotal: 100,
      rapportsTotal: 20,
      notificationsTotal: 50,
      notificationsNonLues: 15,
    };
    expect(dto.ptbaTotal).toBe(30);
    expect(dto.ptbaTermines).toBe(12);
    expect(dto.ptbaEnCours).toBe(10);
    expect(dto.ptbaNonDemarres).toBe(8);
  });

  it('holds all livrable fields', () => {
    const dto: DashboardOverviewDto = {
      ptbaTotal: 0,
      ptbaTermines: 0,
      ptbaEnCours: 0,
      ptbaNonDemarres: 0,
      livrablesTotal: 25,
      livrablesValides: 15,
      livrablesSoumis: 5,
      documentsTotal: 0,
      rapportsTotal: 0,
      notificationsTotal: 0,
      notificationsNonLues: 0,
    };
    expect(dto.livrablesTotal).toBe(25);
    expect(dto.livrablesValides).toBe(15);
    expect(dto.livrablesSoumis).toBe(5);
  });

  it('holds documents, rapports, notifications fields', () => {
    const dto: DashboardOverviewDto = {
      ptbaTotal: 0,
      ptbaTermines: 0,
      ptbaEnCours: 0,
      ptbaNonDemarres: 0,
      livrablesTotal: 0,
      livrablesValides: 0,
      livrablesSoumis: 0,
      documentsTotal: 100,
      rapportsTotal: 20,
      notificationsTotal: 50,
      notificationsNonLues: 15,
    };
    expect(dto.documentsTotal).toBe(100);
    expect(dto.rapportsTotal).toBe(20);
    expect(dto.notificationsTotal).toBe(50);
    expect(dto.notificationsNonLues).toBe(15);
  });

  it('accepts all-zero state', () => {
    const dto: DashboardOverviewDto = {
      ptbaTotal: 0,
      ptbaTermines: 0,
      ptbaEnCours: 0,
      ptbaNonDemarres: 0,
      livrablesTotal: 0,
      livrablesValides: 0,
      livrablesSoumis: 0,
      documentsTotal: 0,
      rapportsTotal: 0,
      notificationsTotal: 0,
      notificationsNonLues: 0,
    };
    expect(dto.notificationsNonLues).toBe(0);
  });
});

// ─── DashboardResponseDto ────────────────────────────────────────────────────

describe('DashboardResponseDto', () => {
  it('composes all sub-DTOs and generatedAt', () => {
    const now = new Date('2026-07-03T10:00:00.000Z');
    const dto: DashboardResponseDto = {
      projets: { total: 10, actifs: 5, termines: 3, suspendus: 2 },
      finances: {
        budgetTotal: 3000,
        montantEngage: 1000,
        montantPaye: 500,
        montantRestant: 2500,
        nombreVersions: 4,
        nombreLignes: 2,
      },
      risques: { total: 5, critiques: 2, eleves: 1 },
      passation: { marchesTotal: 12, marchesTermines: 3, marchesEnCours: 9, etapesTotal: 35 },
      overview: {
        ptbaTotal: 20,
        ptbaTermines: 8,
        ptbaEnCours: 6,
        ptbaNonDemarres: 4,
        livrablesTotal: 18,
        livrablesValides: 10,
        livrablesSoumis: 4,
        documentsTotal: 60,
        rapportsTotal: 15,
        notificationsTotal: 30,
        notificationsNonLues: 7,
      },
      evmData: [],
      decaissementsMensuels: [],
      budgetDistribution: [],
      financementDistribution: [],
      activitesCritiques: [],
      risquesPrincipaux: [],
      jalons: [],
      evenementsRecents: [],
      activitesRecentes: [],
      echeancesProches: [],
      timeline: [],
      generatedAt: now,
    };

    expect(dto.projets).toBeDefined();
    expect(dto.finances).toBeDefined();
    expect(dto.risques).toBeDefined();
    expect(dto.passation).toBeDefined();
    expect(dto.overview).toBeDefined();
    expect(dto.generatedAt).toBe(now);
  });

  it('generatedAt is a Date instance', () => {
    const dto: DashboardResponseDto = {
      projets: { total: 0, actifs: 0, termines: 0, suspendus: 0 },
      finances: {
        budgetTotal: 0,
        montantEngage: 0,
        montantPaye: 0,
        montantRestant: 0,
        nombreVersions: 0,
        nombreLignes: 0,
      },
      risques: { total: 0, critiques: 0, eleves: 0 },
      passation: { marchesTotal: 0, marchesTermines: 0, marchesEnCours: 0, etapesTotal: 0 },
      overview: {
        ptbaTotal: 0,
        ptbaTermines: 0,
        ptbaEnCours: 0,
        ptbaNonDemarres: 0,
        livrablesTotal: 0,
        livrablesValides: 0,
        livrablesSoumis: 0,
        documentsTotal: 0,
        rapportsTotal: 0,
        notificationsTotal: 0,
        notificationsNonLues: 0,
      },
      evmData: [],
      decaissementsMensuels: [],
      budgetDistribution: [],
      financementDistribution: [],
      activitesCritiques: [],
      risquesPrincipaux: [],
      jalons: [],
      evenementsRecents: [],
      activitesRecentes: [],
      echeancesProches: [],
      timeline: [],
      generatedAt: new Date(),
    };

    expect(dto.generatedAt).toBeInstanceOf(Date);
  });
});
