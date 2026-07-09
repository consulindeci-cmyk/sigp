import { PrismaService } from '@/prisma/prisma.service';
import { GouvernanceRepository, FindGouvernanceParams } from './gouvernance.repository';

interface PrismaMock {
  gouvernance: {
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
    gouvernance: {
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

describe('GouvernanceRepository', () => {
  let repo: GouvernanceRepository;
  let prisma: PrismaMock;

  const baseParams: FindGouvernanceParams = { skip: 0, take: 20, orderBy: { created_at: 'desc' } };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new GouvernanceRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns entries + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'g1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ entries: [{ id: 'g1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on nom, role, organisation and email', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'kone' });

      const args = prisma.gouvernance.findMany.mock.calls[0][0] as { where: { OR: unknown[] } };
      expect(args.where.OR).toEqual([
        { nom: { contains: 'kone', mode: 'insensitive' } },
        { role: { contains: 'kone', mode: 'insensitive' } },
        { organisation: { contains: 'kone', mode: 'insensitive' } },
        { email: { contains: 'kone', mode: 'insensitive' } },
      ]);
    });

    it('applies projectId and userId filters when provided', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, projectId: 'proj-1', userId: 'usr-1' });

      const args = prisma.gouvernance.findMany.mock.calls[0][0] as {
        where: { project_id: string; user_id: string };
      };
      expect(args.where.project_id).toBe('proj-1');
      expect(args.where.user_id).toBe('usr-1');
    });

    it('passes pagination (skip/take) and orderBy through to Prisma', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, skip: 40, take: 10, orderBy: { nom: 'asc' } });

      const args = prisma.gouvernance.findMany.mock.calls[0][0] as {
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
      prisma.gouvernance.findFirst.mockResolvedValue({ id: 'g1' });
      await repo.findById('g1');
      expect(prisma.gouvernance.findFirst).toHaveBeenCalledWith({ where: { id: 'g1' } });
    });

    it('findByProject queries by project_id via findMany', async () => {
      prisma.gouvernance.findMany.mockResolvedValue([]);
      await repo.findByProject('proj-1');
      expect(prisma.gouvernance.findMany).toHaveBeenCalledWith({ where: { project_id: 'proj-1' } });
    });
  });

  describe('create()', () => {
    it('maps camelCase fields to Prisma snake_case columns and defaults nullables', async () => {
      prisma.gouvernance.create.mockResolvedValue({ id: 'g1' });

      await repo.create({
        projectId: 'proj-1',
        nom: 'Awa Koné',
        role: 'Président',
        userId: 'usr-1',
        createdBy: 'admin-1',
      });

      expect(prisma.gouvernance.create).toHaveBeenCalledWith({
        data: {
          project_id: 'proj-1',
          nom: 'Awa Koné',
          role: 'Président',
          organisation: null,
          email: null,
          telephone: null,
          user_id: 'usr-1',
          created_by: 'admin-1',
        },
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields including user_id and updated_by', async () => {
      prisma.gouvernance.update.mockResolvedValue({ id: 'g1' });

      await repo.update('g1', { nom: 'Nouveau', userId: 'usr-2', updatedBy: 'a' });

      expect(prisma.gouvernance.update).toHaveBeenCalledWith({
        where: { id: 'g1' },
        data: expect.objectContaining({
          nom: 'Nouveau',
          user_id: 'usr-2',
          updated_by: 'a',
        }),
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.gouvernance.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.gouvernance.delete.mockResolvedValue({ id: 'g1' });
      await repo.softDelete('g1');
      expect(prisma.gouvernance.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
    });
  });
});
