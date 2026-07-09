import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

function buildDashboard(): DashboardResponseDto {
  return {
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
    generatedAt: new Date('2026-07-03T10:00:00.000Z'),
  };
}

function buildMocks() {
  const dashboardService = {
    getDashboard: jest.fn().mockResolvedValue(buildDashboard()),
  } as unknown as jest.Mocked<DashboardService>;

  const controller = new DashboardController(dashboardService);

  return { controller, dashboardService };
}

describe('DashboardController', () => {
  it('getDashboard({ id: "1", role: "VIEWER", email: "test@test.com" } as unknown) delegates to service and returns its result', async () => {
    const { controller, dashboardService } = buildMocks();
    const result = await controller.getDashboard({
      id: '1',
      role: 'VIEWER',
      email: 'test@test.com',
    } as unknown);

    expect(dashboardService.getDashboard).toHaveBeenCalledTimes(1);
    expect(result.projets.total).toBe(10);
    expect(result.finances.budgetTotal).toBe(3000);
  });

  it('returns the full dashboard structure from service', async () => {
    const { controller } = buildMocks();
    const result = await controller.getDashboard({
      id: '1',
      role: 'VIEWER',
      email: 'test@test.com',
    } as unknown);

    expect(result).toHaveProperty('projets');
    expect(result).toHaveProperty('finances');
    expect(result).toHaveProperty('risques');
    expect(result).toHaveProperty('passation');
    expect(result).toHaveProperty('overview');
    expect(result).toHaveProperty('generatedAt');
  });

  it('propagates service errors', async () => {
    const { controller, dashboardService } = buildMocks();
    dashboardService.getDashboard.mockRejectedValueOnce(new Error('Service failure'));

    await expect(
      controller.getDashboard({ id: '1', role: 'VIEWER', email: 'test@test.com' } as unknown),
    ).rejects.toThrow('Service failure');
  });
});
