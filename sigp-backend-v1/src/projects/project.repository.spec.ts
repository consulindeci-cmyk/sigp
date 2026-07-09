import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ProjectRepository, FindProjectsParams } from './project.repository';

interface PrismaMock {
  project: {
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
    project: {
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

describe('ProjectRepository', () => {
  let repo: ProjectRepository;
  let prisma: PrismaMock;

  const baseParams: FindProjectsParams = { skip: 0, take: 20, orderBy: { created_at: 'desc' } };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new ProjectRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns projects + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'p1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ projects: [{ id: 'p1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on nom, code and description', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'sante' });

      const args = prisma.project.findMany.mock.calls[0][0] as { where: { OR: unknown[] } };
      expect(args.where.OR).toEqual([
        { nom: { contains: 'sante', mode: 'insensitive' } },
        { code: { contains: 'sante', mode: 'insensitive' } },
        { description: { contains: 'sante', mode: 'insensitive' } },
      ]);
    });

    it('applies programmeId, statut and managerId filters when provided', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({
        ...baseParams,
        programmeId: 'prg-1',
        statut: ProjectStatus.EN_COURS,
        managerId: 'usr-1',
      });

      const args = prisma.project.findMany.mock.calls[0][0] as {
        where: { programme_id: string; statut: ProjectStatus; manager_id: string };
      };
      expect(args.where.programme_id).toBe('prg-1');
      expect(args.where.statut).toBe(ProjectStatus.EN_COURS);
      expect(args.where.manager_id).toBe('usr-1');
    });

    it('passes pagination (skip/take) and orderBy through to Prisma', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, skip: 40, take: 10, orderBy: { nom: 'asc' } });

      const args = prisma.project.findMany.mock.calls[0][0] as {
        skip: number;
        take: number;
        orderBy: unknown;
      };
      expect(args.skip).toBe(40);
      expect(args.take).toBe(10);
      expect(args.orderBy).toEqual({ nom: 'asc' });
    });
  });

  describe('lookups', () => {
    it('findById queries by id via findFirst', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      await repo.findById('p1');
      expect(prisma.project.findFirst).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });

    it('findByCode queries by code (global uniqueness)', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await repo.findByCode('PRJ-01');
      expect(prisma.project.findFirst).toHaveBeenCalledWith({ where: { code: 'PRJ-01' } });
    });
  });

  describe('create()', () => {
    it('maps camelCase fields to Prisma snake_case columns and defaults nullables', async () => {
      prisma.project.create.mockResolvedValue({ id: 'p1' });

      await repo.create({
        programmeId: 'prg-1',
        code: 'PRJ-01',
        nom: 'Projet 1',
        statut: ProjectStatus.EN_PREPARATION,
        managerId: 'usr-1',
        budgetTotal: 1000,
        createdBy: 'admin-1',
      });

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          programme_id: 'prg-1',
          code: 'PRJ-01',
          nom: 'Projet 1',
          statut: ProjectStatus.EN_PREPARATION,
          manager_id: 'usr-1',
          budget_total: 1000,
          devise: 'XOF',
          created_by: 'admin-1',
        }),
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields including programme_id', async () => {
      prisma.project.update.mockResolvedValue({ id: 'p1' });

      await repo.update('p1', { programmeId: 'prg-2', nom: 'Nouveau', updatedBy: 'a' });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: expect.objectContaining({
          programme_id: 'prg-2',
          nom: 'Nouveau',
          updated_by: 'a',
        }),
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.project.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.project.delete.mockResolvedValue({ id: 'p1' });
      await repo.softDelete('p1');
      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });
  });
});
