import { FundingSource, FundingSourceType, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { FundingSourceRepository } from './funding-source.repository';

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';

function buildSource(overrides: Partial<FundingSource> = {}): FundingSource {
  return {
    id: 'src-0001-0000-0000-000000000000',
    project_id: PROJECT_ID,
    nom: 'Banque Mondiale',
    type: FundingSourceType.BAILLEUR,
    montant: 5000000000 as unknown as Prisma.Decimal,
    pourcentage: 75 as unknown as Prisma.Decimal,
    devise: 'XOF',
    date_accord: new Date('2026-01-15'),
    date_expiry: new Date('2030-12-31'),
    contact: 'contact@worldbank.org',
    notes: 'Composante 1',
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildPrisma() {
  const fundingSource = {
    findMany: jest.fn().mockResolvedValue([buildSource()]),
    findFirst: jest.fn().mockResolvedValue(buildSource()),
    create: jest.fn().mockResolvedValue(buildSource()),
    update: jest.fn().mockResolvedValue(buildSource()),
    delete: jest.fn().mockResolvedValue(buildSource()),
    count: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    fundingSource,
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  return { prisma, fundingSource };
}

describe('FundingSourceRepository', () => {
  let repo: FundingSourceRepository;
  let fundingSource: ReturnType<typeof buildPrisma>['fundingSource'];

  beforeEach(() => {
    const mocks = buildPrisma();
    repo = new FundingSourceRepository(mocks.prisma);
    fundingSource = mocks.fundingSource;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findManyPaginated ───────────────────────────────────────────────────────

  describe('findManyPaginated()', () => {
    it('returns sources and total via $transaction', async () => {
      const result = await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      expect(result.sources).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies projectId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        projectId: PROJECT_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(fundingSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ project_id: PROJECT_ID }) }),
      );
    });

    it('applies type filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        type: FundingSourceType.CONTREPARTIE_NATIONALE,
        orderBy: { created_at: 'desc' },
      });

      expect(fundingSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: FundingSourceType.CONTREPARTIE_NATIONALE }),
        }),
      );
    });

    it('builds OR search across nom, contact, notes', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        search: 'banque',
        orderBy: { created_at: 'desc' },
      });

      expect(fundingSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ nom: expect.objectContaining({ contains: 'banque' }) }),
            ]),
          }),
        }),
      );
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls findFirst with the given id', async () => {
      await repo.findById('src-0001-0000-0000-000000000000');

      expect(fundingSource.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'src-0001-0000-0000-000000000000' }),
        }),
      );
    });

    it('returns null when not found', async () => {
      fundingSource.findFirst.mockResolvedValueOnce(null);
      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });
  });

  // ─── findByProject ───────────────────────────────────────────────────────────

  describe('findByProject()', () => {
    it('calls findMany with project_id filter', async () => {
      await repo.findByProject(PROJECT_ID);

      expect(fundingSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { project_id: PROJECT_ID } }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('maps camelCase to snake_case and applies defaults', async () => {
      await repo.create({
        projectId: PROJECT_ID,
        nom: 'Banque Mondiale',
        montant: 5000000000,
      });

      expect(fundingSource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            project_id: PROJECT_ID,
            nom: 'Banque Mondiale',
            montant: 5000000000,
            type: FundingSourceType.BAILLEUR,
            devise: 'XOF',
          }),
        }),
      );
    });

    it('maps dateAccord and dateExpiry to snake_case', async () => {
      const dateAccord = new Date('2026-01-15');
      const dateExpiry = new Date('2030-12-31');

      await repo.create({
        projectId: PROJECT_ID,
        nom: 'BAD',
        montant: 1000000,
        dateAccord,
        dateExpiry,
      });

      expect(fundingSource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date_accord: dateAccord, date_expiry: dateExpiry }),
        }),
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('calls prisma.update with the given id', async () => {
      await repo.update('src-0001-0000-0000-000000000000', { nom: 'AFD' });

      expect(fundingSource.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'src-0001-0000-0000-000000000000' } }),
      );
    });
  });

  // ─── softDelete ──────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('calls prisma.delete (intercepted by middleware)', async () => {
      await repo.softDelete('src-0001-0000-0000-000000000000');

      expect(fundingSource.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'src-0001-0000-0000-000000000000' } }),
      );
    });
  });
});
