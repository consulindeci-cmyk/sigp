import { GlobalSearchService } from './global-search.service';
import { GlobalSearchQueryDto, SearchModuleFilter } from './dto/global-search-query.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMeta() {
  return {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

function emptyResult() {
  return { data: [], meta: buildMeta() };
}

function makeProjectItem(id: string, nom: string, code = 'CODE') {
  return {
    id,
    programmeId: null,
    code,
    nom,
    description: null,
    statut: 'EN_COURS',
    dateDebut: null,
    dateFinPrevue: null,
    dateFinEffective: null,
    dateClotureEffective: null,
    managerId: null,
    budgetTotal: null,
    devise: 'XOF',
    pays: null,
    secteur: null,
    bailleurPrincipal: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

function makeNotifItem(id: string, titre: string, lue = false) {
  return {
    id,
    userId: 'u-1',
    projectId: 'p-1',
    type: 'RISQUE_CRITIQUE',
    titre,
    message: 'Message de notification',
    lue,
    data: null,
    expiresAt: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

function makeBudgetLine(id: string, libelle: string) {
  return {
    id,
    versionId: 'v-1',
    parentId: null,
    codeLigne: 'L-001',
    libelle,
    categorie: null,
    montantPrevu: 1000,
    montantEngage: 500,
    montantPaye: 200,
    ordre: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

function buildAllMocks() {
  const projectService = { findAll: jest.fn().mockResolvedValue(emptyResult()) };
  const ptbaService = { findAll: jest.fn().mockResolvedValue(emptyResult()) };
  const budgetVersionService = { findAll: jest.fn().mockResolvedValue(emptyResult()) };
  const budgetLineService = { findAll: jest.fn().mockResolvedValue(emptyResult()) };
  const risqueService = { findAll: jest.fn().mockResolvedValue(emptyResult()) };
  const ppmService = { findAll: jest.fn().mockResolvedValue(emptyResult()) };
  const livrableService = { findAll: jest.fn().mockResolvedValue(emptyResult()) };
  const documentService = { findAll: jest.fn().mockResolvedValue(emptyResult()) };
  const reportService = { findAll: jest.fn().mockResolvedValue(emptyResult()) };
  const notificationService = { findAll: jest.fn().mockResolvedValue(emptyResult()) };

  const service = new GlobalSearchService(
    projectService as unknown,
    ptbaService as unknown,
    budgetVersionService as unknown,
    budgetLineService as unknown,
    risqueService as unknown,
    ppmService as unknown,
    livrableService as unknown,
    documentService as unknown,
    reportService as unknown,
    notificationService as unknown,
  );

  return {
    service,
    projectService,
    ptbaService,
    budgetVersionService,
    budgetLineService,
    risqueService,
    ppmService,
    livrableService,
    documentService,
    reportService,
    notificationService,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GlobalSearchService', () => {
  describe('search() — structure', () => {
    it('returns GlobalSearchResponseDto with items, total, query', async () => {
      const { service } = buildAllMocks();
      const result = await service.search({ query: 'santé' } as GlobalSearchQueryDto);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('query', 'santé');
    });

    it('returns empty items when all services return no results', async () => {
      const { service } = buildAllMocks();
      const result = await service.search({ query: 'xyz' } as GlobalSearchQueryDto);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('limits results to 20 even when more are available', async () => {
      const mocks = buildAllMocks();
      const many = Array.from({ length: 25 }, (_, i) =>
        makeProjectItem(`id-${i}`, `Projet numéro ${i}`),
      );
      mocks.projectService.findAll.mockResolvedValue({
        data: many,
        meta: { ...buildMeta(), total: 25 },
      });

      const result = await mocks.service.search({ query: 'projet' } as GlobalSearchQueryDto);

      expect(result.items.length).toBeLessThanOrEqual(20);
    });
  });

  describe('search() — module filter', () => {
    it('queries all services when no module filter is given', async () => {
      const mocks = buildAllMocks();
      await mocks.service.search({ query: 'test' } as GlobalSearchQueryDto);

      expect(mocks.projectService.findAll).toHaveBeenCalled();
      expect(mocks.ptbaService.findAll).toHaveBeenCalled();
      expect(mocks.budgetVersionService.findAll).toHaveBeenCalled();
      expect(mocks.budgetLineService.findAll).toHaveBeenCalled();
      expect(mocks.risqueService.findAll).toHaveBeenCalled();
      expect(mocks.ppmService.findAll).toHaveBeenCalled();
      expect(mocks.livrableService.findAll).toHaveBeenCalled();
      expect(mocks.documentService.findAll).toHaveBeenCalled();
      expect(mocks.reportService.findAll).toHaveBeenCalled();
      expect(mocks.notificationService.findAll).toHaveBeenCalled();
    });

    it('queries only ProjectService when module=projects', async () => {
      const mocks = buildAllMocks();
      await mocks.service.search({
        query: 'test',
        module: SearchModuleFilter.PROJECTS,
      } as GlobalSearchQueryDto);

      expect(mocks.projectService.findAll).toHaveBeenCalled();
      expect(mocks.ptbaService.findAll).not.toHaveBeenCalled();
      expect(mocks.risqueService.findAll).not.toHaveBeenCalled();
      expect(mocks.notificationService.findAll).not.toHaveBeenCalled();
    });

    it('queries only PtbaService when module=ptba', async () => {
      const mocks = buildAllMocks();
      await mocks.service.search({
        query: 'test',
        module: SearchModuleFilter.PTBA,
      } as GlobalSearchQueryDto);

      expect(mocks.ptbaService.findAll).toHaveBeenCalled();
      expect(mocks.projectService.findAll).not.toHaveBeenCalled();
    });

    it('queries BudgetVersionService and BudgetLineService when module=budget', async () => {
      const mocks = buildAllMocks();
      await mocks.service.search({
        query: 'test',
        module: SearchModuleFilter.BUDGET,
      } as GlobalSearchQueryDto);

      expect(mocks.budgetVersionService.findAll).toHaveBeenCalled();
      expect(mocks.budgetLineService.findAll).toHaveBeenCalled();
      expect(mocks.projectService.findAll).not.toHaveBeenCalled();
    });

    it('queries only RisqueService when module=risques', async () => {
      const mocks = buildAllMocks();
      await mocks.service.search({
        query: 'test',
        module: SearchModuleFilter.RISQUES,
      } as GlobalSearchQueryDto);

      expect(mocks.risqueService.findAll).toHaveBeenCalled();
      expect(mocks.projectService.findAll).not.toHaveBeenCalled();
    });

    it('queries only PpmService when module=ppm', async () => {
      const mocks = buildAllMocks();
      await mocks.service.search({
        query: 'test',
        module: SearchModuleFilter.PPM,
      } as GlobalSearchQueryDto);

      expect(mocks.ppmService.findAll).toHaveBeenCalled();
      expect(mocks.projectService.findAll).not.toHaveBeenCalled();
    });

    it('queries only LivrableService when module=livrables', async () => {
      const mocks = buildAllMocks();
      await mocks.service.search({
        query: 'test',
        module: SearchModuleFilter.LIVRABLES,
      } as GlobalSearchQueryDto);

      expect(mocks.livrableService.findAll).toHaveBeenCalled();
      expect(mocks.projectService.findAll).not.toHaveBeenCalled();
    });

    it('queries only DocumentService when module=documents', async () => {
      const mocks = buildAllMocks();
      await mocks.service.search({
        query: 'test',
        module: SearchModuleFilter.DOCUMENTS,
      } as GlobalSearchQueryDto);

      expect(mocks.documentService.findAll).toHaveBeenCalled();
      expect(mocks.projectService.findAll).not.toHaveBeenCalled();
    });

    it('queries only ReportService when module=reports', async () => {
      const mocks = buildAllMocks();
      await mocks.service.search({
        query: 'test',
        module: SearchModuleFilter.REPORTS,
      } as GlobalSearchQueryDto);

      expect(mocks.reportService.findAll).toHaveBeenCalled();
      expect(mocks.projectService.findAll).not.toHaveBeenCalled();
    });

    it('queries only NotificationService when module=notifications', async () => {
      const mocks = buildAllMocks();
      await mocks.service.search({
        query: 'test',
        module: SearchModuleFilter.NOTIFICATIONS,
      } as GlobalSearchQueryDto);

      expect(mocks.notificationService.findAll).toHaveBeenCalled();
      expect(mocks.projectService.findAll).not.toHaveBeenCalled();
    });
  });

  describe('search() — mapping', () => {
    it('maps project fields correctly', async () => {
      const mocks = buildAllMocks();
      mocks.projectService.findAll.mockResolvedValue({
        data: [makeProjectItem('proj-1', 'Projet Santé', 'PRJ-001')],
        meta: { ...buildMeta(), total: 1 },
      });

      const result = await mocks.service.search({
        query: 'santé',
        module: SearchModuleFilter.PROJECTS,
      } as GlobalSearchQueryDto);

      const item = result.items[0];
      expect(item.id).toBe('proj-1');
      expect(item.module).toBe('projects');
      expect(item.title).toBe('Projet Santé');
      expect(item.subtitle).toBe('PRJ-001');
      expect(item.status).toBe('EN_COURS');
      expect(item.url).toBe('/api/v1/projects/proj-1');
      expect(item.projectId).toBe('proj-1');
    });

    it('maps budget line fields with null projectId and null status', async () => {
      const mocks = buildAllMocks();
      mocks.budgetLineService.findAll.mockResolvedValue({
        data: [makeBudgetLine('line-1', 'Frais de personnel')],
        meta: { ...buildMeta(), total: 1 },
      });

      const result = await mocks.service.search({
        query: 'frais',
        module: SearchModuleFilter.BUDGET,
      } as GlobalSearchQueryDto);

      const budgetLineItem = result.items.find((i) => i.url.includes('budget-lines'));
      expect(budgetLineItem).toBeDefined();
      expect(budgetLineItem!.projectId).toBeNull();
      expect(budgetLineItem!.status).toBeNull();
      expect(budgetLineItem!.module).toBe('budget');
    });

    it('maps notification lue=true to status LUE', async () => {
      const mocks = buildAllMocks();
      mocks.notificationService.findAll.mockResolvedValue({
        data: [makeNotifItem('n-1', 'Alerte risque', true)],
        meta: { ...buildMeta(), total: 1 },
      });

      const result = await mocks.service.search({
        query: 'alerte',
        module: SearchModuleFilter.NOTIFICATIONS,
      } as GlobalSearchQueryDto);

      expect(result.items[0].status).toBe('LUE');
    });

    it('maps notification lue=false to status NON_LUE', async () => {
      const mocks = buildAllMocks();
      mocks.notificationService.findAll.mockResolvedValue({
        data: [makeNotifItem('n-2', 'Nouvelle alerte', false)],
        meta: { ...buildMeta(), total: 1 },
      });

      const result = await mocks.service.search({
        query: 'alerte',
        module: SearchModuleFilter.NOTIFICATIONS,
      } as GlobalSearchQueryDto);

      expect(result.items[0].status).toBe('NON_LUE');
    });

    it('truncates notification message longer than 100 chars', async () => {
      const mocks = buildAllMocks();
      const longMessage = 'A'.repeat(150);
      const notif = { ...makeNotifItem('n-3', 'Notif'), message: longMessage };
      mocks.notificationService.findAll.mockResolvedValue({
        data: [notif],
        meta: { ...buildMeta(), total: 1 },
      });

      const result = await mocks.service.search({
        query: 'notif',
        module: SearchModuleFilter.NOTIFICATIONS,
      } as GlobalSearchQueryDto);

      expect(result.items[0].subtitle).toHaveLength(103); // 100 + '...'
    });

    it('passes search query to all called services', async () => {
      const mocks = buildAllMocks();
      await mocks.service.search({
        query: 'formation',
        module: SearchModuleFilter.PROJECTS,
      } as GlobalSearchQueryDto);

      expect(mocks.projectService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'formation' }),
      );
    });
  });

  describe('search() — sorting', () => {
    it('places exact matches before starts-with matches', async () => {
      const mocks = buildAllMocks();
      mocks.projectService.findAll.mockResolvedValue({
        data: [makeProjectItem('p1', 'formation avancée'), makeProjectItem('p2', 'formation')],
        meta: { ...buildMeta(), total: 2 },
      });

      const result = await mocks.service.search({
        query: 'formation',
        module: SearchModuleFilter.PROJECTS,
      } as GlobalSearchQueryDto);

      expect(result.items[0].title).toBe('formation');
      expect(result.items[1].title).toBe('formation avancée');
    });

    it('places starts-with matches before contains matches', async () => {
      const mocks = buildAllMocks();
      mocks.projectService.findAll.mockResolvedValue({
        data: [
          makeProjectItem('p1', 'projet de formation'),
          makeProjectItem('p2', 'formation rurale'),
        ],
        meta: { ...buildMeta(), total: 2 },
      });

      const result = await mocks.service.search({
        query: 'formation',
        module: SearchModuleFilter.PROJECTS,
      } as GlobalSearchQueryDto);

      expect(result.items[0].title).toBe('formation rurale');
      expect(result.items[1].title).toBe('projet de formation');
    });

    it('places exact match first, starts-with second, contains last', async () => {
      const mocks = buildAllMocks();
      mocks.projectService.findAll.mockResolvedValue({
        data: [
          makeProjectItem('p1', 'un projet santé communautaire'),
          makeProjectItem('p2', 'santé rurale'),
          makeProjectItem('p3', 'santé'),
        ],
        meta: { ...buildMeta(), total: 3 },
      });

      const result = await mocks.service.search({
        query: 'santé',
        module: SearchModuleFilter.PROJECTS,
      } as GlobalSearchQueryDto);

      expect(result.items[0].title).toBe('santé');
      expect(result.items[1].title).toBe('santé rurale');
      expect(result.items[2].title).toBe('un projet santé communautaire');
    });

    it('is case-insensitive in relevance scoring', async () => {
      const mocks = buildAllMocks();
      mocks.projectService.findAll.mockResolvedValue({
        data: [makeProjectItem('p1', 'SANTÉ')],
        meta: { ...buildMeta(), total: 1 },
      });

      const result = await mocks.service.search({
        query: 'santé',
        module: SearchModuleFilter.PROJECTS,
      } as GlobalSearchQueryDto);

      expect(result.items[0].title).toBe('SANTÉ');
    });
  });

  describe('search() — fusion', () => {
    it('merges results from multiple services into one list', async () => {
      const mocks = buildAllMocks();
      mocks.projectService.findAll.mockResolvedValue({
        data: [makeProjectItem('proj-1', 'Projet test')],
        meta: { ...buildMeta(), total: 1 },
      });
      mocks.budgetVersionService.findAll.mockResolvedValue({
        data: [
          {
            id: 'bv-1',
            projectId: 'proj-1',
            version: 1,
            nom: 'Budget test',
            statut: 'BROUILLON',
            montantTotal: 1000,
            approvePar: null,
            approuveLe: null,
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: { ...buildMeta(), total: 1 },
      });

      const result = await mocks.service.search({ query: 'test' } as GlobalSearchQueryDto);

      const modules = result.items.map((i) => i.module);
      expect(modules).toContain('projects');
      expect(modules).toContain('budget');
    });

    it('total equals number of items returned (after limiting to 20)', async () => {
      const mocks = buildAllMocks();
      mocks.projectService.findAll.mockResolvedValue({
        data: [makeProjectItem('p1', 'Projet A'), makeProjectItem('p2', 'Projet B')],
        meta: { ...buildMeta(), total: 2 },
      });

      const result = await mocks.service.search({
        query: 'projet',
        module: SearchModuleFilter.PROJECTS,
      } as GlobalSearchQueryDto);

      expect(result.total).toBe(result.items.length);
    });
  });
});
