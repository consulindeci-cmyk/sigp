import { PrismaService } from '@/prisma/prisma.service';
import { DirectionRepository, FindDirectionsParams } from './direction.repository';

interface PrismaMock {
  direction: {
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
    direction: {
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

describe('DirectionRepository', () => {
  let repo: DirectionRepository;
  let prisma: PrismaMock;

  const baseParams: FindDirectionsParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new DirectionRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns directions + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'd1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ directions: [{ id: 'd1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on nom, code and description', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'tech' });

      const args = prisma.direction.findMany.mock.calls[0][0] as { where: { OR: unknown[] } };
      expect(args.where.OR).toEqual([
        { nom: { contains: 'tech', mode: 'insensitive' } },
        { code: { contains: 'tech', mode: 'insensitive' } },
        { description: { contains: 'tech', mode: 'insensitive' } },
      ]);
    });

    it('applies organisationId and actif filters when provided', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, organisationId: 'org-1', actif: true });

      const args = prisma.direction.findMany.mock.calls[0][0] as {
        where: { organisation_id: string; actif: boolean };
      };
      expect(args.where.organisation_id).toBe('org-1');
      expect(args.where.actif).toBe(true);
    });

    it('passes pagination (skip/take) and orderBy through to Prisma', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, skip: 40, take: 10, orderBy: { nom: 'asc' } });

      const args = prisma.direction.findMany.mock.calls[0][0] as {
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
      prisma.direction.findFirst.mockResolvedValue({ id: 'd1' });
      await repo.findById('d1');
      expect(prisma.direction.findFirst).toHaveBeenCalledWith({ where: { id: 'd1' } });
    });

    it('findByCode is scoped to organisation_id + code', async () => {
      prisma.direction.findFirst.mockResolvedValue(null);
      await repo.findByCode('org-1', 'DIR-TECH');
      expect(prisma.direction.findFirst).toHaveBeenCalledWith({
        where: { organisation_id: 'org-1', code: 'DIR-TECH' },
      });
    });

    it('findByName is scoped to organisation_id + nom', async () => {
      prisma.direction.findFirst.mockResolvedValue(null);
      await repo.findByName('org-1', 'Direction Technique');
      expect(prisma.direction.findFirst).toHaveBeenCalledWith({
        where: { organisation_id: 'org-1', nom: 'Direction Technique' },
      });
    });
  });

  describe('create()', () => {
    it('maps organisationId to organisation_id and defaults nullables', async () => {
      prisma.direction.create.mockResolvedValue({ id: 'd1' });

      await repo.create({
        organisationId: 'org-1',
        code: 'DIR-TECH',
        nom: 'Direction Technique',
        createdBy: 'admin-1',
      });

      expect(prisma.direction.create).toHaveBeenCalledWith({
        data: {
          organisation_id: 'org-1',
          code: 'DIR-TECH',
          nom: 'Direction Technique',
          description: null,
          created_by: 'admin-1',
        },
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields (nom, description, actif, updated_by)', async () => {
      prisma.direction.update.mockResolvedValue({ id: 'd1' });

      await repo.update('d1', { nom: 'Nouveau', actif: false, updatedBy: 'a' });

      expect(prisma.direction.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
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
    it('calls prisma.direction.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.direction.delete.mockResolvedValue({ id: 'd1' });
      await repo.softDelete('d1');
      expect(prisma.direction.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
    });
  });
});
