import { PpmEtape } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PpmEtapeRepository } from './ppm-etape.repository';

const MARCHE_ID = 'ppm-0001-0000-0000-000000000000';

function buildEtape(overrides: Partial<PpmEtape> = {}): PpmEtape {
  return {
    id: 'eta-0001-0000-0000-000000000000',
    marche_id: MARCHE_ID,
    libelle: 'Publication de la demande de propositions',
    ordre: 1,
    date_prevue: new Date('2026-03-01'),
    date_reelle: null,
    complete: false,
    notes: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function buildPrisma() {
  const ppmEtape = {
    findMany: jest.fn().mockResolvedValue([buildEtape()]),
    findFirst: jest.fn().mockResolvedValue(buildEtape()),
    create: jest.fn().mockResolvedValue(buildEtape()),
    update: jest.fn().mockResolvedValue(buildEtape()),
    delete: jest.fn().mockResolvedValue(buildEtape()),
    count: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    ppmEtape,
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  return { prisma, ppmEtape };
}

describe('PpmEtapeRepository', () => {
  let repo: PpmEtapeRepository;
  let ppmEtape: ReturnType<typeof buildPrisma>['ppmEtape'];

  beforeEach(() => {
    const mocks = buildPrisma();
    repo = new PpmEtapeRepository(mocks.prisma);
    ppmEtape = mocks.ppmEtape;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findManyPaginated ───────────────────────────────────────────────────────

  describe('findManyPaginated()', () => {
    it('returns etapes and total via $transaction', async () => {
      const result = await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { ordre: 'asc' },
      });

      expect(result.etapes).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies marcheId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        marcheId: MARCHE_ID,
        orderBy: { ordre: 'asc' },
      });

      expect(ppmEtape.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ marche_id: MARCHE_ID }),
        }),
      );
    });

    it('applies complete filter (false)', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        complete: false,
        orderBy: { ordre: 'asc' },
      });

      expect(ppmEtape.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ complete: false }),
        }),
      );
    });

    it('applies complete filter (true)', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        complete: true,
        orderBy: { ordre: 'asc' },
      });

      expect(ppmEtape.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ complete: true }),
        }),
      );
    });

    it('builds OR search on libelle and notes', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        search: 'propositions',
        orderBy: { ordre: 'asc' },
      });

      expect(ppmEtape.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                libelle: expect.objectContaining({ contains: 'propositions' }),
              }),
              expect.objectContaining({
                notes: expect.objectContaining({ contains: 'propositions' }),
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
      await repo.findById('eta-0001-0000-0000-000000000000');

      expect(ppmEtape.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'eta-0001-0000-0000-000000000000' }),
        }),
      );
    });

    it('returns null when not found', async () => {
      ppmEtape.findFirst.mockResolvedValueOnce(null);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  // ─── findByPpmMarche ─────────────────────────────────────────────────────────

  describe('findByPpmMarche()', () => {
    it('filters by marche_id', async () => {
      await repo.findByPpmMarche(MARCHE_ID);

      expect(ppmEtape.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { marche_id: MARCHE_ID } }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('maps camelCase to snake_case and applies complete=false default', async () => {
      await repo.create({
        marcheId: MARCHE_ID,
        libelle: 'Publication',
        ordre: 1,
      });

      expect(ppmEtape.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            marche_id: MARCHE_ID,
            libelle: 'Publication',
            ordre: 1,
            complete: false,
          }),
        }),
      );
    });

    it('maps date fields to snake_case', async () => {
      const datePrevue = new Date('2026-03-01');
      await repo.create({
        marcheId: MARCHE_ID,
        libelle: 'Publication',
        ordre: 1,
        datePrevue,
      });

      expect(ppmEtape.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date_prevue: datePrevue }),
        }),
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('calls prisma.update with the given id', async () => {
      await repo.update('eta-0001-0000-0000-000000000000', { complete: true });

      expect(ppmEtape.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'eta-0001-0000-0000-000000000000' } }),
      );
    });
  });

  // ─── softDelete ──────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('calls prisma.delete (physical delete — no deleted_at on PpmEtape)', async () => {
      await repo.softDelete('eta-0001-0000-0000-000000000000');

      expect(ppmEtape.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'eta-0001-0000-0000-000000000000' } }),
      );
    });
  });
});
