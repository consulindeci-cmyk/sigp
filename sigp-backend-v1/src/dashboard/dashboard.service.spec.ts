import { LivrableStatus, PpmMarcheStatus, ProjectStatus, PtbaStatut } from '@prisma/client';
import { DashboardService } from './dashboard.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMeta(total: number) {
  return { total, page: 1, limit: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false };
}

function buildResult<T>(data: T[], total: number) {
  return { data, meta: buildMeta(total) };
}

function mockLine(montantPrevu: number, montantEngage: number, montantPaye: number) {
  return {
    id: 'line-1',
    versionId: 'v-1',
    parentId: null,
    codeLigne: 'L-001',
    libelle: 'Ligne test',
    categorie: null,
    montantPrevu,
    montantEngage,
    montantPaye,
    ordre: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function mockRisque(niveauCriticite: string) {
  return {
    id: 'r-1',
    projectId: 'p-1',
    wbsId: null,
    code: null,
    description: 'Test',
    categorie: null,
    probabilite: 'PROBABLE',
    impact: 'IMPORTANT',
    niveauCriticite,
    statut: 'OUVERT',
    strategie: null,
    planAction: null,
    responsableId: null,
    dateDetection: null,
    dateEcheance: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function buildMocks() {
  const projectService = {
    findAll: jest.fn().mockImplementation((query: { statut?: ProjectStatus }) => {
      if (query.statut === ProjectStatus.EN_COURS) return Promise.resolve(buildResult([], 5));
      if (query.statut === ProjectStatus.CLOTURE) return Promise.resolve(buildResult([], 3));
      if (query.statut === ProjectStatus.SUSPENDU) return Promise.resolve(buildResult([], 2));
      return Promise.resolve(buildResult([], 10));
    }),
  };

  const budgetVersionService = {
    findAll: jest.fn().mockResolvedValue(buildResult([], 4)),
  };

  const budgetLineService = {
    findAll: jest
      .fn()
      .mockResolvedValue(buildResult([mockLine(1000, 400, 200), mockLine(2000, 600, 300)], 2)),
  };

  const ptbaService = {
    findAll: jest.fn().mockImplementation((query: { statut?: PtbaStatut }) => {
      if (query.statut === PtbaStatut.TERMINE) return Promise.resolve(buildResult([], 8));
      if (query.statut === PtbaStatut.EN_COURS) return Promise.resolve(buildResult([], 6));
      if (query.statut === PtbaStatut.NON_DEMARRE) return Promise.resolve(buildResult([], 4));
      return Promise.resolve(buildResult([], 20));
    }),
  };

  const risqueService = {
    findAll: jest
      .fn()
      .mockResolvedValue(
        buildResult(
          [
            mockRisque('CRITIQUE'),
            mockRisque('CRITIQUE'),
            mockRisque('ELEVE'),
            mockRisque('MODERE'),
            mockRisque('FAIBLE'),
          ],
          5,
        ),
      ),
  };

  const ppmService = {
    findAll: jest.fn().mockImplementation((query: { statut?: PpmMarcheStatus }) => {
      if (query.statut === PpmMarcheStatus.CLOTURE) return Promise.resolve(buildResult([], 3));
      return Promise.resolve(buildResult([], 12));
    }),
  };

  const ppmEtapeService = {
    findAll: jest.fn().mockResolvedValue(buildResult([], 35)),
  };

  const livrableService = {
    findAll: jest.fn().mockImplementation((query: { statut?: LivrableStatus }) => {
      if (query.statut === LivrableStatus.VALIDE) return Promise.resolve(buildResult([], 10));
      if (query.statut === LivrableStatus.SOUMIS) return Promise.resolve(buildResult([], 4));
      return Promise.resolve(buildResult([], 18));
    }),
  };

  const documentService = {
    findAll: jest.fn().mockResolvedValue(buildResult([], 60)),
  };

  const reportService = {
    findAll: jest.fn().mockResolvedValue(buildResult([], 15)),
  };

  const notificationService = {
    findAll: jest.fn().mockImplementation((query: { lue?: boolean }) => {
      if (query.lue === false) return Promise.resolve(buildResult([], 7));
      return Promise.resolve(buildResult([], 30));
    }),
  };

  const prismaService = {
    disbursement: { findMany: jest.fn().mockResolvedValue([]) },
    budgetLigne: {
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({
        _sum: { montant_prevu: 3000, montant_engage: 1000, montant_paye: 500 },
        _count: { _all: 2 },
      }),
    },
    fundingSource: { findMany: jest.fn().mockResolvedValue([]) },
    ptbaActivite: { findMany: jest.fn().mockResolvedValue([]) },
    risque: { findMany: jest.fn().mockResolvedValue([]) },
    notification: { findMany: jest.fn().mockResolvedValue([]) },
    contract: { findMany: jest.fn().mockResolvedValue([]) },
    evmSnapshot: { findMany: jest.fn().mockResolvedValue([]) },
  };

  const service = new DashboardService(
    projectService as unknown,
    budgetVersionService as unknown,
    budgetLineService as unknown,
    ptbaService as unknown,
    risqueService as unknown,
    ppmService as unknown,
    ppmEtapeService as unknown,
    livrableService as unknown,
    documentService as unknown,
    reportService as unknown,
    notificationService as unknown,
    prismaService as unknown,
  );

  return {
    service,
    projectService,
    budgetVersionService,
    budgetLineService,
    ptbaService,
    risqueService,
    ppmService,
    ppmEtapeService,
    livrableService,
    documentService,
    reportService,
    notificationService,
    prismaService,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DashboardService', () => {
  describe('getDashboard("1", "VIEWER")', () => {
    it('returns a complete DashboardResponseDto structure', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result).toHaveProperty('projets');
      expect(result).toHaveProperty('finances');
      expect(result).toHaveProperty('risques');
      expect(result).toHaveProperty('passation');
      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('generatedAt');
    });

    it('aggregates project totals correctly', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.projets.total).toBe(10);
      expect(result.projets.actifs).toBe(5);
      expect(result.projets.termines).toBe(3);
      expect(result.projets.suspendus).toBe(2);
    });

    it('sums montantPrevu from budget lines', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.finances.budgetTotal).toBe(3000); // 1000 + 2000
    });

    it('sums montantEngage from budget lines', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.finances.montantEngage).toBe(1000); // 400 + 600
    });

    it('sums montantPaye from budget lines', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.finances.montantPaye).toBe(500); // 200 + 300
    });

    it('computes montantRestant = budgetTotal - montantPaye', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.finances.montantRestant).toBe(2500); // 3000 - 500
    });

    it('reports nombreVersions from BudgetVersionService', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.finances.nombreVersions).toBe(4);
    });

    it('reports nombreLignes from aggregate count', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.finances.nombreLignes).toBe(2);
    });

    it('counts risques critiques from data', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.risques.critiques).toBe(2);
    });

    it('counts risques eleves from data', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.risques.eleves).toBe(1);
    });

    it('reports risques total from meta.total', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.risques.total).toBe(5);
    });

    it('computes marchesEnCours = marchesTotal - marchesTermines', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.passation.marchesTotal).toBe(12);
      expect(result.passation.marchesTermines).toBe(3);
      expect(result.passation.marchesEnCours).toBe(9);
    });

    it('reports etapesTotal from PpmEtapeService', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.passation.etapesTotal).toBe(35);
    });

    it('aggregates PTBA stats by status', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.overview.ptbaTotal).toBe(20);
      expect(result.overview.ptbaTermines).toBe(8);
      expect(result.overview.ptbaEnCours).toBe(6);
      expect(result.overview.ptbaNonDemarres).toBe(4);
    });

    it('aggregates livrables stats by status', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.overview.livrablesTotal).toBe(18);
      expect(result.overview.livrablesValides).toBe(10);
      expect(result.overview.livrablesSoumis).toBe(4);
    });

    it('reports documents, rapports counts', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.overview.documentsTotal).toBe(60);
      expect(result.overview.rapportsTotal).toBe(15);
    });

    it('reports notifications total and non lues', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.overview.notificationsTotal).toBe(30);
      expect(result.overview.notificationsNonLues).toBe(7);
    });

    it('returns generatedAt as a Date', async () => {
      const { service } = buildMocks();
      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('handles empty budget lines — all amounts are 0', async () => {
      const { service, prismaService } = buildMocks();
      (prismaService.budgetLigne.aggregate as jest.Mock).mockResolvedValue({
        _sum: { montant_prevu: null, montant_engage: null, montant_paye: null },
        _count: { _all: 0 },
      });

      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.finances.budgetTotal).toBe(0);
      expect(result.finances.montantEngage).toBe(0);
      expect(result.finances.montantPaye).toBe(0);
      expect(result.finances.montantRestant).toBe(0);
    });

    it('handles empty risques — critiques and eleves are 0', async () => {
      const { service, risqueService } = buildMocks();
      risqueService.findAll.mockResolvedValue(buildResult([], 0));

      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.risques.critiques).toBe(0);
      expect(result.risques.eleves).toBe(0);
      expect(result.risques.total).toBe(0);
    });

    it('handles zero marchesTermines — marchesEnCours equals marchesTotal', async () => {
      const { service, ppmService } = buildMocks();
      ppmService.findAll.mockImplementation((query: { statut?: PpmMarcheStatus }) => {
        if (query.statut === PpmMarcheStatus.CLOTURE) return Promise.resolve(buildResult([], 0));
        return Promise.resolve(buildResult([], 8));
      });

      const result = await service.getDashboard('1', 'VIEWER');

      expect(result.passation.marchesEnCours).toBe(8);
    });

    it('calls all original dependency services', async () => {
      const mocks = buildMocks();
      await mocks.service.getDashboard('1', 'VIEWER');

      expect(mocks.projectService.findAll).toHaveBeenCalled();
      expect(mocks.budgetVersionService.findAll).toHaveBeenCalled();
      expect(mocks.ptbaService.findAll).toHaveBeenCalled();
      expect(mocks.risqueService.findAll).toHaveBeenCalled();
      expect(mocks.ppmService.findAll).toHaveBeenCalled();
      expect(mocks.ppmEtapeService.findAll).toHaveBeenCalled();
      expect(mocks.livrableService.findAll).toHaveBeenCalled();
      expect(mocks.documentService.findAll).toHaveBeenCalled();
      expect(mocks.reportService.findAll).toHaveBeenCalled();
      expect(mocks.notificationService.findAll).toHaveBeenCalled();
    });

    it('filters projects by EN_COURS for actifs count', async () => {
      const { service, projectService } = buildMocks();
      await service.getDashboard('1', 'VIEWER');

      expect(projectService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ statut: ProjectStatus.EN_COURS }),
      );
    });

    it('filters notifications with lue: false for non lues count', async () => {
      const { service, notificationService } = buildMocks();
      await service.getDashboard('1', 'VIEWER');

      expect(notificationService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ lue: false }),
      );
    });
  });
});
