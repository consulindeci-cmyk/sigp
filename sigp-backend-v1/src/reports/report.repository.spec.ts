import { FormatRapport, RapportProjet, StatutRapport, TypeRapport } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ReportRepository } from './report.repository';

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';
const REPORT_ID = 'rpt-00001-000-0000-000000000000';

function buildReport(overrides: Partial<RapportProjet> = {}): RapportProjet {
  return {
    id: REPORT_ID,
    project_id: PROJECT_ID,
    code_rapport: 'RPT-001',
    titre: 'Rapport mensuel — Janvier 2026',
    description: null,
    type: TypeRapport.MENSUEL,
    format: FormatRapport.PDF,
    statut: StatutRapport.GENERE,
    periode: 'Janvier 2026',
    date_generation: new Date('2026-01-31'),
    date_telechargement: null,
    version: '1.0',
    auteur: 'Amadou Diallo',
    taille_ko: 3200,
    nb_telechargements: 0,
    commentaires: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-31T00:00:00Z'),
    updated_at: new Date('2026-01-31T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildPrisma() {
  const rapportProjet = {
    findMany: jest.fn().mockResolvedValue([buildReport()]),
    findFirst: jest.fn().mockResolvedValue(buildReport()),
    create: jest.fn().mockResolvedValue(buildReport()),
    update: jest.fn().mockResolvedValue(buildReport()),
    count: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    rapportProjet,
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  return { prisma, rapportProjet };
}

describe('ReportRepository', () => {
  let repo: ReportRepository;
  let rapportProjet: ReturnType<typeof buildPrisma>['rapportProjet'];

  beforeEach(() => {
    const mocks = buildPrisma();
    repo = new ReportRepository(mocks.prisma);
    rapportProjet = mocks.rapportProjet;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findManyPaginated ───────────────────────────────────────────────────────

  describe('findManyPaginated()', () => {
    it('returns reports and total via $transaction', async () => {
      const result = await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      expect(result.reports).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies projectId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        projectId: PROJECT_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(rapportProjet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ project_id: PROJECT_ID }),
        }),
      );
    });

    it('applies type filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        type: TypeRapport.MENSUEL,
        orderBy: { created_at: 'desc' },
      });

      expect(rapportProjet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: TypeRapport.MENSUEL }),
        }),
      );
    });

    it('applies format filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        format: FormatRapport.PDF,
        orderBy: { created_at: 'desc' },
      });

      expect(rapportProjet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ format: FormatRapport.PDF }),
        }),
      );
    });

    it('applies statut filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        statut: StatutRapport.VALIDE,
        orderBy: { created_at: 'desc' },
      });

      expect(rapportProjet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statut: StatutRapport.VALIDE }),
        }),
      );
    });

    it('builds OR search on titre, description, auteur, code_rapport', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        search: 'amadou',
        orderBy: { created_at: 'desc' },
      });

      expect(rapportProjet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ titre: expect.objectContaining({ contains: 'amadou' }) }),
              expect.objectContaining({ auteur: expect.objectContaining({ contains: 'amadou' }) }),
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

      expect(rapportProjet.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls findFirst with the given id', async () => {
      await repo.findById(REPORT_ID);

      expect(rapportProjet.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: REPORT_ID }) }),
      );
    });

    it('returns null when not found', async () => {
      rapportProjet.findFirst.mockResolvedValueOnce(null);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  // ─── findByProject ───────────────────────────────────────────────────────────

  describe('findByProject()', () => {
    it('filters by project_id', async () => {
      await repo.findByProject(PROJECT_ID);

      expect(rapportProjet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { project_id: PROJECT_ID } }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('maps camelCase to snake_case fields', async () => {
      await repo.create({
        projectId: PROJECT_ID,
        codeRapport: 'RPT-001',
        titre: 'Rapport mensuel',
        type: TypeRapport.MENSUEL,
        format: FormatRapport.PDF,
        periode: 'Janvier 2026',
        dateGeneration: new Date('2026-01-31'),
        version: '1.0',
        auteur: 'Amadou Diallo',
      });

      expect(rapportProjet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            project_id: PROJECT_ID,
            code_rapport: 'RPT-001',
            titre: 'Rapport mensuel',
          }),
        }),
      );
    });

    it('stores optional fields', async () => {
      await repo.create({
        projectId: PROJECT_ID,
        codeRapport: 'RPT-001',
        titre: 'Rapport mensuel',
        type: TypeRapport.MENSUEL,
        format: FormatRapport.PDF,
        periode: 'Janvier 2026',
        dateGeneration: new Date('2026-01-31'),
        version: '1.0',
        auteur: 'Amadou Diallo',
        commentaires: 'Commentaire test',
        tailleKo: 3200,
        nbTelechargements: 5,
      });

      expect(rapportProjet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commentaires: 'Commentaire test',
            taille_ko: 3200,
            nb_telechargements: 5,
          }),
        }),
      );
    });

    it('stores createdBy from actor', async () => {
      await repo.create({
        projectId: PROJECT_ID,
        codeRapport: 'RPT-001',
        titre: 'Rapport',
        type: TypeRapport.MENSUEL,
        format: FormatRapport.PDF,
        periode: 'Janvier 2026',
        dateGeneration: new Date('2026-01-31'),
        version: '1.0',
        auteur: 'Amadou Diallo',
        createdBy: 'admin-1',
      });

      expect(rapportProjet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ created_by: 'admin-1' }),
        }),
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('calls prisma.update with the given id', async () => {
      await repo.update(REPORT_ID, { statut: StatutRapport.VALIDE });

      expect(rapportProjet.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: REPORT_ID } }),
      );
    });

    it('passes statut on update', async () => {
      await repo.update(REPORT_ID, { statut: StatutRapport.VALIDE });

      expect(rapportProjet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ statut: StatutRapport.VALIDE }),
        }),
      );
    });

    it('passes updated_by on update', async () => {
      await repo.update(REPORT_ID, { updatedBy: 'admin-1' });

      expect(rapportProjet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ updated_by: 'admin-1' }),
        }),
      );
    });
  });

  // ─── softDelete ──────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('sets deleted_at via prisma.update (soft delete)', async () => {
      await repo.softDelete(REPORT_ID);

      expect(rapportProjet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: REPORT_ID },
          data: expect.objectContaining({ deleted_at: expect.any(Date) }),
        }),
      );
    });
  });
});
