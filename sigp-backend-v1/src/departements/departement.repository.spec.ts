import { PrismaService } from '@/prisma/prisma.service';
import { DepartementRepository, FindDepartementsParams } from './departement.repository';

interface PrismaMock {
  departement: {
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
    departement: {
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

describe('DepartementRepository', () => {
  let repo: DepartementRepository;
  let prisma: PrismaMock;

  const baseParams: FindDepartementsParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new DepartementRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns departements + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'p1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ departements: [{ id: 'p1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on nom, code and description', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'info' });

      const args = prisma.departement.findMany.mock.calls[0][0] as { where: { OR: unknown[] } };
      expect(args.where.OR).toEqual([
        { nom: { contains: 'info', mode: 'insensitive' } },
        { code: { contains: 'info', mode: 'insensitive' } },
        { description: { contains: 'info', mode: 'insensitive' } },
      ]);
    });

    it('applies directionId and actif filters when provided', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, directionId: 'dir-1', actif: false });

      const args = prisma.departement.findMany.mock.calls[0][0] as {
        where: { direction_id: string; actif: boolean };
      };
      expect(args.where.direction_id).toBe('dir-1');
      expect(args.where.actif).toBe(false);
    });

    it('passes pagination (skip/take) and orderBy through to Prisma', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, skip: 40, take: 10, orderBy: { nom: 'asc' } });

      const args = prisma.departement.findMany.mock.calls[0][0] as {
        skip: number;
        take: number;
        orderBy: unknown;
      };
      expect(args.skip).toBe(40);
      expect(args.take).toBe(10);
      expect(args.orderBy).toEqual({ nom: 'asc' });
    });
  });

  describe('scoped lookups', () => {
    it('findById queries by id via findFirst', async () => {
      prisma.departement.findFirst.mockResolvedValue({ id: 'p1' });
      await repo.findById('p1');
      expect(prisma.departement.findFirst).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });

    it('findByCode is scoped to direction_id + code', async () => {
      prisma.departement.findFirst.mockResolvedValue(null);
      await repo.findByCode('dir-1', 'DEP-SI');
      expect(prisma.departement.findFirst).toHaveBeenCalledWith({
        where: { direction_id: 'dir-1', code: 'DEP-SI' },
      });
    });

    it('findByName is scoped to direction_id + nom', async () => {
      prisma.departement.findFirst.mockResolvedValue(null);
      await repo.findByName('dir-1', 'Département SI');
      expect(prisma.departement.findFirst).toHaveBeenCalledWith({
        where: { direction_id: 'dir-1', nom: 'Département SI' },
      });
    });
  });

  describe('create()', () => {
    it('maps directionId to direction_id and defaults nullables', async () => {
      prisma.departement.create.mockResolvedValue({ id: 'p1' });

      await repo.create({
        directionId: 'dir-1',
        code: 'DEP-SI',
        nom: 'Département SI',
        createdBy: 'admin-1',
      });

      expect(prisma.departement.create).toHaveBeenCalledWith({
        data: {
          direction_id: 'dir-1',
          code: 'DEP-SI',
          nom: 'Département SI',
          description: null,
          created_by: 'admin-1',
        },
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields (nom, description, actif, updated_by)', async () => {
      prisma.departement.update.mockResolvedValue({ id: 'p1' });

      await repo.update('p1', { nom: 'Nouveau', actif: false, updatedBy: 'a' });

      expect(prisma.departement.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: {
          nom: 'Nouveau',
          description: undefined,
          actif: false,
          updated_by: 'a',
        },
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.departement.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.departement.delete.mockResolvedValue({ id: 'p1' });
      await repo.softDelete('p1');
      expect(prisma.departement.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });
  });
});
