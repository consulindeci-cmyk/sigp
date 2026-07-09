import { PpmMarche, PpmMarcheStatus, PpmTypeMarche, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PpmRepository } from './ppm.repository';

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';

function buildMarche(overrides: Partial<PpmMarche> = {}): PpmMarche {
  return {
    id: 'ppm-0001-0000-0000-000000000000',
    project_id: PROJECT_ID,
    code: 'MRC-2026-001',
    intitule: 'Acquisition de matériel informatique',
    type: PpmTypeMarche.FOURNITURES,
    statut: PpmMarcheStatus.EN_PREPARATION,
    montant_estime: 5000000 as unknown as Prisma.Decimal,
    montant_signe: null,
    date_lancement_prevu: new Date('2026-03-01'),
    date_soumission_prevu: new Date('2026-04-01'),
    date_attribution: null,
    date_signature: null,
    date_fin_prevue: new Date('2026-12-31'),
    date_fin_effective: null,
    titulaire: null,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildPrisma() {
  const ppmMarche = {
    findMany: jest.fn().mockResolvedValue([buildMarche()]),
    findFirst: jest.fn().mockResolvedValue(buildMarche()),
    create: jest.fn().mockResolvedValue(buildMarche()),
    update: jest.fn().mockResolvedValue(buildMarche()),
    delete: jest.fn().mockResolvedValue(buildMarche()),
    count: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    ppmMarche,
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  return { prisma, ppmMarche };
}

describe('PpmRepository', () => {
  let repo: PpmRepository;
  let ppmMarche: ReturnType<typeof buildPrisma>['ppmMarche'];

  beforeEach(() => {
    const mocks = buildPrisma();
    repo = new PpmRepository(mocks.prisma);
    ppmMarche = mocks.ppmMarche;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findManyPaginated ───────────────────────────────────────────────────────

  describe('findManyPaginated()', () => {
    it('returns marches and total via $transaction', async () => {
      const result = await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      expect(result.marches).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies projectId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        projectId: PROJECT_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(ppmMarche.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ project_id: PROJECT_ID }),
        }),
      );
    });

    it('applies type filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        type: PpmTypeMarche.TRAVAUX,
        orderBy: { created_at: 'desc' },
      });

      expect(ppmMarche.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: PpmTypeMarche.TRAVAUX }),
        }),
      );
    });

    it('applies statut filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        statut: PpmMarcheStatus.SIGNE,
        orderBy: { created_at: 'desc' },
      });

      expect(ppmMarche.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statut: PpmMarcheStatus.SIGNE }),
        }),
      );
    });

    it('builds OR search on code, intitule, titulaire, notes', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        search: 'informatique',
        orderBy: { created_at: 'desc' },
      });

      expect(ppmMarche.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                code: expect.objectContaining({ contains: 'informatique' }),
              }),
              expect.objectContaining({
                intitule: expect.objectContaining({ contains: 'informatique' }),
              }),
              expect.objectContaining({
                titulaire: expect.objectContaining({ contains: 'informatique' }),
              }),
              expect.objectContaining({
                notes: expect.objectContaining({ contains: 'informatique' }),
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
      await repo.findById('ppm-0001-0000-0000-000000000000');

      expect(ppmMarche.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'ppm-0001-0000-0000-000000000000' }),
        }),
      );
    });

    it('returns null when not found', async () => {
      ppmMarche.findFirst.mockResolvedValueOnce(null);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  // ─── findByProject ────────────────────────────────────────────────────────────

  describe('findByProject()', () => {
    it('filters by project_id', async () => {
      await repo.findByProject(PROJECT_ID);

      expect(ppmMarche.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { project_id: PROJECT_ID } }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('maps camelCase to snake_case', async () => {
      await repo.create({
        projectId: PROJECT_ID,
        code: 'MRC-2026-001',
        intitule: 'Acquisition matériel',
        type: PpmTypeMarche.FOURNITURES,
      });

      expect(ppmMarche.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            project_id: PROJECT_ID,
            code: 'MRC-2026-001',
            type: PpmTypeMarche.FOURNITURES,
          }),
        }),
      );
    });

    it('maps date fields to snake_case', async () => {
      const dateLancementPrevu = new Date('2026-03-01');
      await repo.create({
        projectId: PROJECT_ID,
        code: 'MRC-001',
        intitule: 'Test',
        type: PpmTypeMarche.SERVICES,
        dateLancementPrevu,
      });

      expect(ppmMarche.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date_lancement_prevu: dateLancementPrevu }),
        }),
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('calls prisma.update with the given id', async () => {
      await repo.update('ppm-0001-0000-0000-000000000000', { statut: PpmMarcheStatus.SIGNE });

      expect(ppmMarche.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'ppm-0001-0000-0000-000000000000' } }),
      );
    });
  });

  // ─── softDelete ──────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('calls prisma.delete (intercepted by middleware)', async () => {
      await repo.softDelete('ppm-0001-0000-0000-000000000000');

      expect(ppmMarche.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'ppm-0001-0000-0000-000000000000' } }),
      );
    });
  });
});
