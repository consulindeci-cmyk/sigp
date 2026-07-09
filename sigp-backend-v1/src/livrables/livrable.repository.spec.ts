import { Livrable, LivrableStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { LivrableRepository } from './livrable.repository';

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';
const LIVRABLE_ID = 'livr-0001-0000-0000-000000000000';

function buildLivrable(overrides: Partial<Livrable> = {}): Livrable {
  return {
    id: LIVRABLE_ID,
    project_id: PROJECT_ID,
    wbs_id: null,
    code: 'LIV-001',
    nom: 'Rapport de lancement',
    description: null,
    statut: LivrableStatus.NON_COMMENCE,
    date_prevue: null,
    date_soumission: null,
    date_validation: null,
    responsable_id: null,
    validateur_id: null,
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
  const livrable = {
    findMany: jest.fn().mockResolvedValue([buildLivrable()]),
    findFirst: jest.fn().mockResolvedValue(buildLivrable()),
    create: jest.fn().mockResolvedValue(buildLivrable()),
    update: jest.fn().mockResolvedValue(buildLivrable()),
    count: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    livrable,
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  return { prisma, livrable };
}

describe('LivrableRepository', () => {
  let repo: LivrableRepository;
  let livrable: ReturnType<typeof buildPrisma>['livrable'];

  beforeEach(() => {
    const mocks = buildPrisma();
    repo = new LivrableRepository(mocks.prisma);
    livrable = mocks.livrable;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findManyPaginated ───────────────────────────────────────────────────────

  describe('findManyPaginated()', () => {
    it('returns livrables and total via $transaction', async () => {
      const result = await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      expect(result.livrables).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies projectId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        projectId: PROJECT_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(livrable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ project_id: PROJECT_ID }),
        }),
      );
    });

    it('applies statut filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        statut: LivrableStatus.EN_COURS,
        orderBy: { created_at: 'desc' },
      });

      expect(livrable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statut: LivrableStatus.EN_COURS }),
        }),
      );
    });

    it('builds OR search on code, nom, description, notes', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        search: 'rapport',
        orderBy: { created_at: 'desc' },
      });

      expect(livrable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ code: expect.objectContaining({ contains: 'rapport' }) }),
              expect.objectContaining({ nom: expect.objectContaining({ contains: 'rapport' }) }),
              expect.objectContaining({
                description: expect.objectContaining({ contains: 'rapport' }),
              }),
              expect.objectContaining({ notes: expect.objectContaining({ contains: 'rapport' }) }),
            ]),
          }),
        }),
      );
    });

    it('returns empty where clause when no filters provided', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      expect(livrable.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls findFirst with the given id', async () => {
      await repo.findById(LIVRABLE_ID);

      expect(livrable.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: LIVRABLE_ID }) }),
      );
    });

    it('returns null when not found', async () => {
      livrable.findFirst.mockResolvedValueOnce(null);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  // ─── findByProject ───────────────────────────────────────────────────────────

  describe('findByProject()', () => {
    it('filters by project_id', async () => {
      await repo.findByProject(PROJECT_ID);

      expect(livrable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { project_id: PROJECT_ID } }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('maps camelCase to snake_case fields', async () => {
      await repo.create({
        projectId: PROJECT_ID,
        nom: 'Rapport de lancement',
      });

      expect(livrable.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            project_id: PROJECT_ID,
            nom: 'Rapport de lancement',
          }),
        }),
      );
    });

    it('stores optional date fields', async () => {
      const datePrevue = new Date('2026-06-01');
      await repo.create({
        projectId: PROJECT_ID,
        nom: 'Livrable test',
        datePrevue,
      });

      expect(livrable.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date_prevue: datePrevue }),
        }),
      );
    });

    it('stores code and responsableId', async () => {
      await repo.create({
        projectId: PROJECT_ID,
        nom: 'Livrable test',
        code: 'LIV-001',
        responsableId: 'user-0001-0000-0000-000000000000',
      });

      expect(livrable.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'LIV-001',
            responsable_id: 'user-0001-0000-0000-000000000000',
          }),
        }),
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('calls prisma.update with the given id', async () => {
      await repo.update(LIVRABLE_ID, { statut: LivrableStatus.EN_COURS });

      expect(livrable.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: LIVRABLE_ID } }),
      );
    });

    it('passes statut on update', async () => {
      await repo.update(LIVRABLE_ID, { statut: LivrableStatus.SOUMIS });

      expect(livrable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ statut: LivrableStatus.SOUMIS }),
        }),
      );
    });

    it('passes updated_by on update', async () => {
      await repo.update(LIVRABLE_ID, { updatedBy: 'admin-1' });

      expect(livrable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ updated_by: 'admin-1' }),
        }),
      );
    });
  });

  // ─── softDelete ──────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('sets deleted_at via prisma.update (soft delete)', async () => {
      await repo.softDelete(LIVRABLE_ID);

      expect(livrable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: LIVRABLE_ID },
          data: expect.objectContaining({ deleted_at: expect.any(Date) }),
        }),
      );
    });
  });
});
