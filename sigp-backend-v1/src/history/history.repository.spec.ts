import { AuditAction } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { HistoryRepository } from './history.repository';
import { HistoriqueWithRelations } from './dto/history-response.dto';

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';
const USER_ID = 'user-0001-000-0000-000000000000';

function buildEntry(overrides: Partial<HistoriqueWithRelations> = {}): HistoriqueWithRelations {
  return {
    id: 'hist-0001-000-0000-000000000000',
    project_id: PROJECT_ID,
    user_id: USER_ID,
    action: AuditAction.CREATE,
    table_cible: 'contracts',
    enregistrement_id: 'ctr-0001-0000-0000-000000000000',
    avant: null,
    apres: { numero: 'CTR-2026-001' },
    ip_address: '192.168.1.10',
    user_agent: 'Chrome 120 / Windows 11',
    created_at: new Date('2026-07-13T08:00:00Z'),
    user: { id: USER_ID, nom: 'Diallo', prenom: 'Amadou', role: 'COORDINATEUR' },
    project: { id: PROJECT_ID, code: 'SIGP-2026', nom: 'Projet Test' },
    ...overrides,
  } as HistoriqueWithRelations;
}

function buildPrisma() {
  const historique = {
    findMany: jest.fn().mockResolvedValue([buildEntry()]),
    findFirst: jest.fn().mockResolvedValue(buildEntry()),
    count: jest.fn().mockResolvedValue(1),
    groupBy: jest.fn().mockResolvedValue([]),
  };

  const prisma = {
    historique,
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
    $queryRaw: jest.fn().mockResolvedValue([]),
  } as unknown as PrismaService;

  return { prisma, historique };
}

describe('HistoryRepository', () => {
  let repo: HistoryRepository;
  let historique: ReturnType<typeof buildPrisma>['historique'];

  beforeEach(() => {
    const mocks = buildPrisma();
    repo = new HistoryRepository(mocks.prisma);
    historique = mocks.historique;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findManyPaginated ───────────────────────────────────────────────────────

  describe('findManyPaginated()', () => {
    it('returns entries and total via $transaction', async () => {
      const result = await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      expect(result.entries).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('includes user and project relations', async () => {
      await repo.findManyPaginated({ skip: 0, take: 20, orderBy: { created_at: 'desc' } });

      expect(historique.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.any(Object),
            project: expect.any(Object),
          }),
        }),
      );
    });

    it('applies projectId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        projectId: PROJECT_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(historique.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ project_id: PROJECT_ID }) }),
      );
    });

    it('applies userId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        userId: USER_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(historique.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ user_id: USER_ID }) }),
      );
    });

    it('applies action filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        action: AuditAction.DELETE,
        orderBy: { created_at: 'desc' },
      });

      expect(historique.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ action: AuditAction.DELETE }) }),
      );
    });

    it('applies module (table_cible) filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        module: 'contracts',
        orderBy: { created_at: 'desc' },
      });

      expect(historique.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ table_cible: 'contracts' }) }),
      );
    });

    it('applies dateFrom/dateTo range filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
        orderBy: { created_at: 'desc' },
      });

      expect(historique.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: { gte: new Date('2026-01-01'), lte: new Date('2026-12-31') },
          }),
        }),
      );
    });

    it('builds OR search on table_cible, enregistrement_id, user nom/prenom', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        search: 'diallo',
        orderBy: { created_at: 'desc' },
      });

      expect(historique.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ table_cible: expect.objectContaining({ contains: 'diallo' }) }),
            ]),
          }),
        }),
      );
    });

    it('returns empty where clause when no filters provided', async () => {
      await repo.findManyPaginated({ skip: 0, take: 20, orderBy: { created_at: 'desc' } });

      expect(historique.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls findFirst with the given id and relations included', async () => {
      await repo.findById('hist-0001-000-0000-000000000000');

      expect(historique.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'hist-0001-000-0000-000000000000' },
          include: expect.any(Object),
        }),
      );
    });

    it('returns null when not found', async () => {
      historique.findFirst.mockResolvedValueOnce(null);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  // ─── findDistinctModules ────────────────────────────────────────────────────

  describe('findDistinctModules()', () => {
    it('returns distinct table_cible values', async () => {
      historique.findMany.mockResolvedValueOnce([
        { table_cible: 'contracts' },
        { table_cible: 'livrables' },
      ]);

      const modules = await repo.findDistinctModules();

      expect(historique.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ distinct: ['table_cible'] }),
      );
      expect(modules).toEqual(['contracts', 'livrables']);
    });
  });

  // ─── stats ───────────────────────────────────────────────────────────────────

  describe('countTotal() / countSince()', () => {
    it('scopes countTotal by projectId when provided', async () => {
      await repo.countTotal(PROJECT_ID);
      expect(historique.count).toHaveBeenCalledWith({ where: { project_id: PROJECT_ID } });
    });

    it('countTotal with no projectId counts everything', async () => {
      await repo.countTotal();
      expect(historique.count).toHaveBeenCalledWith({ where: {} });
    });

    it('countSince filters by created_at gte', async () => {
      const since = new Date('2026-07-01');
      await repo.countSince(since);
      expect(historique.count).toHaveBeenCalledWith({ where: { created_at: { gte: since } } });
    });
  });

  describe('countByAction() / countByModule()', () => {
    it('groups by action', async () => {
      historique.groupBy.mockResolvedValueOnce([
        { action: AuditAction.CREATE, _count: { _all: 5 } },
      ]);
      const result = await repo.countByAction({});
      expect(result).toEqual([{ action: AuditAction.CREATE, count: 5 }]);
    });

    it('groups by table_cible', async () => {
      historique.groupBy.mockResolvedValueOnce([
        { table_cible: 'contracts', _count: { _all: 3 } },
      ]);
      const result = await repo.countByModule({});
      expect(result).toEqual([{ module: 'contracts', count: 3 }]);
    });
  });
});
