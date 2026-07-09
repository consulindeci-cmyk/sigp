import { PrismaService } from '@/prisma/prisma.service';
import { UniteRepository, FindUnitesParams } from './unite.repository';

interface PrismaMock {
  unite: {
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
    unite: {
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

describe('UniteRepository', () => {
  let repo: UniteRepository;
  let prisma: PrismaMock;

  const baseParams: FindUnitesParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new UniteRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns unites + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'u1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ unites: [{ id: 'u1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on nom, code and description', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'reseau' });

      const args = prisma.unite.findMany.mock.calls[0][0] as { where: { OR: unknown[] } };
      expect(args.where.OR).toEqual([
        { nom: { contains: 'reseau', mode: 'insensitive' } },
        { code: { contains: 'reseau', mode: 'insensitive' } },
        { description: { contains: 'reseau', mode: 'insensitive' } },
      ]);
    });

    it('applies departementId and actif filters when provided', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, departementId: 'dep-1', actif: true });

      const args = prisma.unite.findMany.mock.calls[0][0] as {
        where: { departement_id: string; actif: boolean };
      };
      expect(args.where.departement_id).toBe('dep-1');
      expect(args.where.actif).toBe(true);
    });

    it('passes pagination (skip/take) and orderBy through to Prisma', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, skip: 40, take: 10, orderBy: { nom: 'asc' } });

      const args = prisma.unite.findMany.mock.calls[0][0] as {
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
      prisma.unite.findFirst.mockResolvedValue({ id: 'u1' });
      await repo.findById('u1');
      expect(prisma.unite.findFirst).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('findByCode is scoped to departement_id + code', async () => {
      prisma.unite.findFirst.mockResolvedValue(null);
      await repo.findByCode('dep-1', 'UNI-RESEAU');
      expect(prisma.unite.findFirst).toHaveBeenCalledWith({
        where: { departement_id: 'dep-1', code: 'UNI-RESEAU' },
      });
    });

    it('findByName is scoped to departement_id + nom', async () => {
      prisma.unite.findFirst.mockResolvedValue(null);
      await repo.findByName('dep-1', 'Unité Réseau');
      expect(prisma.unite.findFirst).toHaveBeenCalledWith({
        where: { departement_id: 'dep-1', nom: 'Unité Réseau' },
      });
    });
  });

  describe('create()', () => {
    it('maps departementId to departement_id and defaults nullables', async () => {
      prisma.unite.create.mockResolvedValue({ id: 'u1' });

      await repo.create({
        departementId: 'dep-1',
        code: 'UNI-RESEAU',
        nom: 'Unité Réseau',
        createdBy: 'admin-1',
      });

      expect(prisma.unite.create).toHaveBeenCalledWith({
        data: {
          departement_id: 'dep-1',
          code: 'UNI-RESEAU',
          nom: 'Unité Réseau',
          description: null,
          created_by: 'admin-1',
        },
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields (nom, description, actif, updated_by)', async () => {
      prisma.unite.update.mockResolvedValue({ id: 'u1' });

      await repo.update('u1', { nom: 'Nouveau', actif: false, updatedBy: 'a' });

      expect(prisma.unite.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
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
    it('calls prisma.unite.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.unite.delete.mockResolvedValue({ id: 'u1' });
      await repo.softDelete('u1');
      expect(prisma.unite.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });
  });
});
