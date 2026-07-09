import { PrismaService } from '@/prisma/prisma.service';
import { BudgetLineRepository, FindBudgetLinesParams } from './budget-line.repository';

interface PrismaMock {
  budgetLigne: {
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
    budgetLigne: {
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

describe('BudgetLineRepository', () => {
  let repo: BudgetLineRepository;
  let prisma: PrismaMock;

  const baseParams: FindBudgetLinesParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new BudgetLineRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns lignes + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'l1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ lignes: [{ id: 'l1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on code_ligne, libelle and categorie', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'personnel' });

      const args = prisma.budgetLigne.findMany.mock.calls[0][0] as { where: { OR: unknown[] } };
      expect(args.where.OR).toEqual([
        { code_ligne: { contains: 'personnel', mode: 'insensitive' } },
        { libelle: { contains: 'personnel', mode: 'insensitive' } },
        { categorie: { contains: 'personnel', mode: 'insensitive' } },
      ]);
    });

    it('applies versionId and parentId filters', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({
        ...baseParams,
        versionId: 'bv-1',
        parentId: 'parent-1',
      });

      const args = prisma.budgetLigne.findMany.mock.calls[0][0] as {
        where: { version_id: string; parent_id: string };
      };
      expect(args.where.version_id).toBe('bv-1');
      expect(args.where.parent_id).toBe('parent-1');
    });
  });

  describe('lookups', () => {
    it('findById queries by id via findFirst', async () => {
      prisma.budgetLigne.findFirst.mockResolvedValue({ id: 'l1' });
      await repo.findById('l1');
      expect(prisma.budgetLigne.findFirst).toHaveBeenCalledWith({ where: { id: 'l1' } });
    });

    it('findByBudgetVersion queries by version_id via findMany', async () => {
      prisma.budgetLigne.findMany.mockResolvedValue([]);
      await repo.findByBudgetVersion('bv-1');
      expect(prisma.budgetLigne.findMany).toHaveBeenCalledWith({
        where: { version_id: 'bv-1' },
      });
    });
  });

  describe('create()', () => {
    it('maps camelCase fields to Prisma snake_case columns and defaults montants to 0', async () => {
      prisma.budgetLigne.create.mockResolvedValue({ id: 'l1' });

      await repo.create({
        versionId: 'bv-1',
        parentId: 'parent-1',
        codeLigne: 'PERS-001',
        libelle: 'Personnel permanent',
        categorie: 'RH',
        montantPrevu: 50000000,
        createdBy: 'admin-1',
      });

      expect(prisma.budgetLigne.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version_id: 'bv-1',
          parent_id: 'parent-1',
          code_ligne: 'PERS-001',
          libelle: 'Personnel permanent',
          categorie: 'RH',
          montant_prevu: 50000000,
          montant_engage: 0,
          montant_paye: 0,
          created_by: 'admin-1',
        }),
      });
    });

    it('defaults all montants to 0 when not provided', async () => {
      prisma.budgetLigne.create.mockResolvedValue({ id: 'l1' });

      await repo.create({ versionId: 'bv-1', codeLigne: 'X-001', libelle: 'Test' });

      expect(prisma.budgetLigne.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          montant_prevu: 0,
          montant_engage: 0,
          montant_paye: 0,
          ordre: 0,
        }),
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields including montant_engage and updated_by', async () => {
      prisma.budgetLigne.update.mockResolvedValue({ id: 'l1' });

      await repo.update('l1', { montantEngage: 12000000, updatedBy: 'admin-1' });

      expect(prisma.budgetLigne.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: expect.objectContaining({
          montant_engage: 12000000,
          updated_by: 'admin-1',
        }),
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.budgetLigne.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.budgetLigne.delete.mockResolvedValue({ id: 'l1' });
      await repo.softDelete('l1');
      expect(prisma.budgetLigne.delete).toHaveBeenCalledWith({ where: { id: 'l1' } });
    });
  });
});
