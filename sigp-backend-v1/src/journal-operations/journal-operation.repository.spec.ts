import { JournalType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  JournalOperationRepository,
  FindJournalOperationsParams,
} from './journal-operation.repository';

interface PrismaMock {
  journalOperation: {
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
    journalOperation: {
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

describe('JournalOperationRepository', () => {
  let repo: JournalOperationRepository;
  let prisma: PrismaMock;

  const baseParams: FindJournalOperationsParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new JournalOperationRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns operations + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'op1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ operations: [{ id: 'op1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on reference and description', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'bon-2026' });

      const args = prisma.journalOperation.findMany.mock.calls[0][0] as {
        where: { OR: unknown[] };
      };
      expect(args.where.OR).toEqual([
        { reference: { contains: 'bon-2026', mode: 'insensitive' } },
        { description: { contains: 'bon-2026', mode: 'insensitive' } },
      ]);
    });

    it('applies budgetLineId and type filters', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({
        ...baseParams,
        budgetLineId: 'bl-1',
        type: JournalType.DEPENSE,
      });

      const args = prisma.journalOperation.findMany.mock.calls[0][0] as {
        where: { budget_ligne_id: string; type: JournalType };
      };
      expect(args.where.budget_ligne_id).toBe('bl-1');
      expect(args.where.type).toBe(JournalType.DEPENSE);
    });
  });

  describe('lookups', () => {
    it('findById queries by id via findFirst', async () => {
      prisma.journalOperation.findFirst.mockResolvedValue({ id: 'op1' });
      await repo.findById('op1');
      expect(prisma.journalOperation.findFirst).toHaveBeenCalledWith({ where: { id: 'op1' } });
    });

    it('findByBudgetLine queries by budget_ligne_id via findMany', async () => {
      prisma.journalOperation.findMany.mockResolvedValue([]);
      await repo.findByBudgetLine('bl-1');
      expect(prisma.journalOperation.findMany).toHaveBeenCalledWith({
        where: { budget_ligne_id: 'bl-1' },
      });
    });
  });

  describe('create()', () => {
    it('maps camelCase fields to Prisma snake_case columns including date_operation', async () => {
      prisma.journalOperation.create.mockResolvedValue({ id: 'op1' });
      const date = new Date('2026-03-15');

      await repo.create({
        budgetLineId: 'bl-1',
        type: JournalType.DEPENSE,
        montant: 5000000,
        dateOperation: date,
        reference: 'BON-001',
        createdBy: 'admin-1',
      });

      expect(prisma.journalOperation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          budget_ligne_id: 'bl-1',
          type: JournalType.DEPENSE,
          montant: 5000000,
          date_operation: date,
          reference: 'BON-001',
          description: null,
          piece_jointe_id: null,
          created_by: 'admin-1',
        }),
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields including type and updated_by', async () => {
      prisma.journalOperation.update.mockResolvedValue({ id: 'op1' });

      await repo.update('op1', { type: JournalType.RECETTE, updatedBy: 'admin-1' });

      expect(prisma.journalOperation.update).toHaveBeenCalledWith({
        where: { id: 'op1' },
        data: expect.objectContaining({
          type: JournalType.RECETTE,
          updated_by: 'admin-1',
        }),
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.journalOperation.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.journalOperation.delete.mockResolvedValue({ id: 'op1' });
      await repo.softDelete('op1');
      expect(prisma.journalOperation.delete).toHaveBeenCalledWith({ where: { id: 'op1' } });
    });
  });
});
