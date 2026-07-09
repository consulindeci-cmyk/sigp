import { ProgrammeStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ProgrammeRepository, FindProgrammesParams } from './programme.repository';

interface PrismaMock {
  programme: {
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
    programme: {
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

describe('ProgrammeRepository', () => {
  let repo: ProgrammeRepository;
  let prisma: PrismaMock;

  const baseParams: FindProgrammesParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new ProgrammeRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns programmes + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'p1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ programmes: [{ id: 'p1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on nom, code and description', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'sante' });

      const args = prisma.programme.findMany.mock.calls[0][0] as { where: { OR: unknown[] } };
      expect(args.where.OR).toEqual([
        { nom: { contains: 'sante', mode: 'insensitive' } },
        { code: { contains: 'sante', mode: 'insensitive' } },
        { description: { contains: 'sante', mode: 'insensitive' } },
      ]);
    });

    it('applies uniteId, statut and actif filters when provided', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({
        ...baseParams,
        uniteId: 'uni-1',
        statut: ProgrammeStatus.EN_COURS,
        actif: true,
      });

      const args = prisma.programme.findMany.mock.calls[0][0] as {
        where: { unite_id: string; statut: ProgrammeStatus; actif: boolean };
      };
      expect(args.where.unite_id).toBe('uni-1');
      expect(args.where.statut).toBe(ProgrammeStatus.EN_COURS);
      expect(args.where.actif).toBe(true);
    });

    it('passes pagination (skip/take) and orderBy through to Prisma', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, skip: 40, take: 10, orderBy: { nom: 'asc' } });

      const args = prisma.programme.findMany.mock.calls[0][0] as {
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
      prisma.programme.findFirst.mockResolvedValue({ id: 'p1' });
      await repo.findById('p1');
      expect(prisma.programme.findFirst).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });

    it('findByCode is scoped to unite_id + code', async () => {
      prisma.programme.findFirst.mockResolvedValue(null);
      await repo.findByCode('uni-1', 'PRG-SANTE');
      expect(prisma.programme.findFirst).toHaveBeenCalledWith({
        where: { unite_id: 'uni-1', code: 'PRG-SANTE' },
      });
    });

    it('findByName is scoped to unite_id + nom', async () => {
      prisma.programme.findFirst.mockResolvedValue(null);
      await repo.findByName('uni-1', 'Programme Santé');
      expect(prisma.programme.findFirst).toHaveBeenCalledWith({
        where: { unite_id: 'uni-1', nom: 'Programme Santé' },
      });
    });
  });

  describe('create()', () => {
    it('maps uniteId to unite_id, forwards statut, and defaults nullables', async () => {
      prisma.programme.create.mockResolvedValue({ id: 'p1' });

      await repo.create({
        uniteId: 'uni-1',
        code: 'PRG-SANTE',
        nom: 'Programme Santé',
        statut: ProgrammeStatus.EN_PREPARATION,
        createdBy: 'admin-1',
      });

      expect(prisma.programme.create).toHaveBeenCalledWith({
        data: {
          unite_id: 'uni-1',
          code: 'PRG-SANTE',
          nom: 'Programme Santé',
          description: null,
          statut: ProgrammeStatus.EN_PREPARATION,
          created_by: 'admin-1',
        },
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields (nom, description, statut, actif, updated_by)', async () => {
      prisma.programme.update.mockResolvedValue({ id: 'p1' });

      await repo.update('p1', {
        nom: 'Nouveau',
        statut: ProgrammeStatus.CLOTURE,
        actif: false,
        updatedBy: 'a',
      });

      expect(prisma.programme.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: {
          nom: 'Nouveau',
          description: undefined,
          statut: ProgrammeStatus.CLOTURE,
          actif: false,
          updated_by: 'a',
        },
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.programme.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.programme.delete.mockResolvedValue({ id: 'p1' });
      await repo.softDelete('p1');
      expect(prisma.programme.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });
  });
});
