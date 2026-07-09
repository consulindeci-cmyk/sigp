import { LogframeLevel } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  LogframeObjectiveRepository,
  FindLogframeObjectivesParams,
} from './logframe-objective.repository';

interface PrismaMock {
  logframeObjective: {
    findMany: jest.Mock;
    count: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
}

function buildPrismaMock(): PrismaMock {
  return {
    logframeObjective: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('LogframeObjectiveRepository', () => {
  let repo: LogframeObjectiveRepository;
  let prisma: PrismaMock;

  const baseParams: FindLogframeObjectivesParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new LogframeObjectiveRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns objectives + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'o1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ objectives: [{ id: 'o1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on code, libelle and description', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'soins' });

      const args = prisma.logframeObjective.findMany.mock.calls[0][0] as {
        where: { OR: unknown[] };
      };
      expect(args.where.OR).toEqual([
        { code: { contains: 'soins', mode: 'insensitive' } },
        { libelle: { contains: 'soins', mode: 'insensitive' } },
        { description: { contains: 'soins', mode: 'insensitive' } },
      ]);
    });

    it('applies projectId, niveau, parentId and actif filters', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({
        ...baseParams,
        projectId: 'proj-1',
        niveau: LogframeLevel.RESULTAT,
        parentId: 'par-1',
        actif: true,
      });

      const args = prisma.logframeObjective.findMany.mock.calls[0][0] as {
        where: { project_id: string; niveau: LogframeLevel; parent_id: string; actif: boolean };
      };
      expect(args.where.project_id).toBe('proj-1');
      expect(args.where.niveau).toBe(LogframeLevel.RESULTAT);
      expect(args.where.parent_id).toBe('par-1');
      expect(args.where.actif).toBe(true);
    });
  });

  describe('lookups', () => {
    it('findById queries by id via findFirst', async () => {
      prisma.logframeObjective.findFirst.mockResolvedValue({ id: 'o1' });
      await repo.findById('o1');
      expect(prisma.logframeObjective.findFirst).toHaveBeenCalledWith({ where: { id: 'o1' } });
    });

    it('findByProject queries by project_id via findMany', async () => {
      prisma.logframeObjective.findMany.mockResolvedValue([]);
      await repo.findByProject('proj-1');
      expect(prisma.logframeObjective.findMany).toHaveBeenCalledWith({
        where: { project_id: 'proj-1' },
      });
    });
  });

  describe('create()', () => {
    it('maps camelCase fields to Prisma snake_case columns and defaults nullables', async () => {
      prisma.logframeObjective.create.mockResolvedValue({ id: 'o1' });

      await repo.create({
        projectId: 'proj-1',
        niveau: LogframeLevel.OBJECTIF_GLOBAL,
        code: 'OG-1',
        libelle: 'Améliorer l’accès',
        parentId: 'par-1',
        ordre: 2,
        createdBy: 'admin-1',
      });

      expect(prisma.logframeObjective.create).toHaveBeenCalledWith({
        data: {
          project_id: 'proj-1',
          niveau: LogframeLevel.OBJECTIF_GLOBAL,
          code: 'OG-1',
          libelle: 'Améliorer l’accès',
          description: null,
          parent_id: 'par-1',
          ordre: 2,
          created_by: 'admin-1',
        },
      });
    });

    it('defaults ordre to 0 when omitted', async () => {
      prisma.logframeObjective.create.mockResolvedValue({ id: 'o1' });

      await repo.create({
        projectId: 'proj-1',
        niveau: LogframeLevel.ACTIVITE,
        code: 'A-1',
        libelle: 'Activité',
      });

      const arg = prisma.logframeObjective.create.mock.calls[0][0] as { data: { ordre: number } };
      expect(arg.data.ordre).toBe(0);
    });
  });

  describe('update()', () => {
    it('forwards mutable fields including parent_id, actif and updated_by', async () => {
      prisma.logframeObjective.update.mockResolvedValue({ id: 'o1' });

      await repo.update('o1', {
        libelle: 'Nouveau',
        parentId: 'par-2',
        actif: false,
        updatedBy: 'a',
      });

      expect(prisma.logframeObjective.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: expect.objectContaining({
          libelle: 'Nouveau',
          parent_id: 'par-2',
          actif: false,
          updated_by: 'a',
        }),
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.logframeObjective.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.logframeObjective.delete.mockResolvedValue({ id: 'o1' });
      await repo.softDelete('o1');
      expect(prisma.logframeObjective.delete).toHaveBeenCalledWith({ where: { id: 'o1' } });
    });
  });
});
