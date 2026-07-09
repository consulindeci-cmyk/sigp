import { BudgetStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { BudgetVersionRepository, FindBudgetVersionsParams } from './budget-version.repository';

interface PrismaMock {
  budgetVersion: {
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
    budgetVersion: {
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

describe('BudgetVersionRepository', () => {
  let repo: BudgetVersionRepository;
  let prisma: PrismaMock;

  const baseParams: FindBudgetVersionsParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new BudgetVersionRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns versions + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'v1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ versions: [{ id: 'v1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on nom and notes', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'budget initial' });

      const args = prisma.budgetVersion.findMany.mock.calls[0][0] as { where: { OR: unknown[] } };
      expect(args.where.OR).toEqual([
        { nom: { contains: 'budget initial', mode: 'insensitive' } },
        { notes: { contains: 'budget initial', mode: 'insensitive' } },
      ]);
    });

    it('applies projectId, statut and version filters', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({
        ...baseParams,
        projectId: 'proj-1',
        statut: BudgetStatus.APPROUVE,
        version: 2,
      });

      const args = prisma.budgetVersion.findMany.mock.calls[0][0] as {
        where: { project_id: string; statut: BudgetStatus; version: number };
      };
      expect(args.where.project_id).toBe('proj-1');
      expect(args.where.statut).toBe(BudgetStatus.APPROUVE);
      expect(args.where.version).toBe(2);
    });
  });

  describe('lookups', () => {
    it('findById queries by id via findFirst', async () => {
      prisma.budgetVersion.findFirst.mockResolvedValue({ id: 'v1' });
      await repo.findById('v1');
      expect(prisma.budgetVersion.findFirst).toHaveBeenCalledWith({ where: { id: 'v1' } });
    });

    it('findByProject queries by project_id via findMany', async () => {
      prisma.budgetVersion.findMany.mockResolvedValue([]);
      await repo.findByProject('proj-1');
      expect(prisma.budgetVersion.findMany).toHaveBeenCalledWith({
        where: { project_id: 'proj-1' },
      });
    });
  });

  describe('create()', () => {
    it('maps camelCase fields to Prisma snake_case columns and defaults nullables', async () => {
      prisma.budgetVersion.create.mockResolvedValue({ id: 'v1' });

      await repo.create({
        projectId: 'proj-1',
        version: 1,
        nom: 'Budget initial',
        statut: BudgetStatus.BROUILLON,
        montantTotal: 150000000,
        createdBy: 'admin-1',
      });

      expect(prisma.budgetVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          project_id: 'proj-1',
          version: 1,
          nom: 'Budget initial',
          statut: BudgetStatus.BROUILLON,
          montant_total: 150000000,
          approuve_par: null,
          approuve_le: null,
          notes: null,
          created_by: 'admin-1',
        }),
      });
    });

    it('uses default version 1 and montant_total 0 when not provided', async () => {
      prisma.budgetVersion.create.mockResolvedValue({ id: 'v1' });

      await repo.create({ projectId: 'proj-1', nom: 'Budget' });

      expect(prisma.budgetVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ version: 1, montant_total: 0 }),
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields including statut and updated_by', async () => {
      prisma.budgetVersion.update.mockResolvedValue({ id: 'v1' });

      await repo.update('v1', { statut: BudgetStatus.APPROUVE, updatedBy: 'admin-1' });

      expect(prisma.budgetVersion.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: expect.objectContaining({
          statut: BudgetStatus.APPROUVE,
          updated_by: 'admin-1',
        }),
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.budgetVersion.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.budgetVersion.delete.mockResolvedValue({ id: 'v1' });
      await repo.softDelete('v1');
      expect(prisma.budgetVersion.delete).toHaveBeenCalledWith({ where: { id: 'v1' } });
    });
  });
});
