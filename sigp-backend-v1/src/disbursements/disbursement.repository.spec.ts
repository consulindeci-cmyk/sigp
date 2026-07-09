import { Disbursement, DisbursementStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { DisbursementRepository } from './disbursement.repository';

const VERSION_ID = 'ver-0001-0000-0000-000000000000';
const LINE_ID = 'lin-0001-0000-0000-000000000000';
const SOURCE_ID = 'src-0001-0000-0000-000000000000';

function buildDisbursement(overrides: Partial<Disbursement> = {}): Disbursement {
  return {
    id: 'dis-0001-0000-0000-000000000000',
    budget_version_id: VERSION_ID,
    budget_ligne_id: LINE_ID,
    contract_id: null,
    funding_source_id: SOURCE_ID,
    statut: DisbursementStatus.PLANIFIE,
    montant: 5000000 as unknown as Prisma.Decimal,
    date_prevue: new Date('2026-06-01'),
    date_reelle: null,
    reference: 'DEC-2026-001',
    description: 'Premier décaissement',
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildPrisma() {
  const disbursement = {
    findMany: jest.fn().mockResolvedValue([buildDisbursement()]),
    findFirst: jest.fn().mockResolvedValue(buildDisbursement()),
    create: jest.fn().mockResolvedValue(buildDisbursement()),
    update: jest.fn().mockResolvedValue(buildDisbursement()),
    delete: jest.fn().mockResolvedValue(buildDisbursement()),
    count: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    disbursement,
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  return { prisma, disbursement };
}

describe('DisbursementRepository', () => {
  let repo: DisbursementRepository;
  let disbursement: ReturnType<typeof buildPrisma>['disbursement'];

  beforeEach(() => {
    const mocks = buildPrisma();
    repo = new DisbursementRepository(mocks.prisma);
    disbursement = mocks.disbursement;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findManyPaginated ───────────────────────────────────────────────────────

  describe('findManyPaginated()', () => {
    it('returns disbursements and total via $transaction', async () => {
      const result = await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      expect(result.disbursements).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies budgetVersionId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        budgetVersionId: VERSION_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(disbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ budget_version_id: VERSION_ID }),
        }),
      );
    });

    it('applies budgetLineId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        budgetLineId: LINE_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(disbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ budget_ligne_id: LINE_ID }) }),
      );
    });

    it('applies fundingSourceId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        fundingSourceId: SOURCE_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(disbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ funding_source_id: SOURCE_ID }),
        }),
      );
    });

    it('applies statut filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        statut: DisbursementStatus.APPROUVE,
        orderBy: { created_at: 'desc' },
      });

      expect(disbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statut: DisbursementStatus.APPROUVE }),
        }),
      );
    });

    it('builds OR search on reference and description', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        search: 'DEC',
        orderBy: { created_at: 'desc' },
      });

      expect(disbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ reference: expect.objectContaining({ contains: 'DEC' }) }),
              expect.objectContaining({
                description: expect.objectContaining({ contains: 'DEC' }),
              }),
            ]),
          }),
        }),
      );
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls findFirst with the given id', async () => {
      await repo.findById('dis-0001-0000-0000-000000000000');

      expect(disbursement.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'dis-0001-0000-0000-000000000000' }),
        }),
      );
    });

    it('returns null when not found', async () => {
      disbursement.findFirst.mockResolvedValueOnce(null);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  // ─── findByBudgetVersion ─────────────────────────────────────────────────────

  describe('findByBudgetVersion()', () => {
    it('filters by budget_version_id', async () => {
      await repo.findByBudgetVersion(VERSION_ID);

      expect(disbursement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { budget_version_id: VERSION_ID } }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('maps camelCase to snake_case and applies PLANIFIE default', async () => {
      await repo.create({ montant: 5000000 });

      expect(disbursement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            montant: 5000000,
            statut: DisbursementStatus.PLANIFIE,
          }),
        }),
      );
    });

    it('maps date fields to snake_case', async () => {
      const datePrevue = new Date('2026-06-01');
      await repo.create({ montant: 1000, datePrevue, budgetVersionId: VERSION_ID });

      expect(disbursement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            budget_version_id: VERSION_ID,
            date_prevue: datePrevue,
          }),
        }),
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('calls prisma.update with the given id', async () => {
      await repo.update('dis-0001-0000-0000-000000000000', { statut: DisbursementStatus.APPROUVE });

      expect(disbursement.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'dis-0001-0000-0000-000000000000' } }),
      );
    });
  });

  // ─── softDelete ──────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('calls prisma.delete (intercepted by middleware)', async () => {
      await repo.softDelete('dis-0001-0000-0000-000000000000');

      expect(disbursement.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'dis-0001-0000-0000-000000000000' } }),
      );
    });
  });
});
