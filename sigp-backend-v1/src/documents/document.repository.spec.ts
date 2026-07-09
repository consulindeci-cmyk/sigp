import { DocumentProjet, DocumentStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { DocumentRepository } from './document.repository';

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';
const DOCUMENT_ID = 'doc-00001-0000-0000-000000000000';
const LIVRABLE_ID = 'livr-0001-0000-0000-000000000000';

function buildDocument(overrides: Partial<DocumentProjet> = {}): DocumentProjet {
  return {
    id: DOCUMENT_ID,
    project_id: PROJECT_ID,
    livrable_id: null,
    titre: 'Rapport de démarrage',
    description: null,
    statut: DocumentStatus.BROUILLON,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildPrisma() {
  const documentProjet = {
    findMany: jest.fn().mockResolvedValue([buildDocument()]),
    findFirst: jest.fn().mockResolvedValue(buildDocument()),
    create: jest.fn().mockResolvedValue(buildDocument()),
    update: jest.fn().mockResolvedValue(buildDocument()),
    count: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    documentProjet,
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  return { prisma, documentProjet };
}

describe('DocumentRepository', () => {
  let repo: DocumentRepository;
  let documentProjet: ReturnType<typeof buildPrisma>['documentProjet'];

  beforeEach(() => {
    const mocks = buildPrisma();
    repo = new DocumentRepository(mocks.prisma);
    documentProjet = mocks.documentProjet;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findManyPaginated ───────────────────────────────────────────────────────

  describe('findManyPaginated()', () => {
    it('returns documents and total via $transaction', async () => {
      const result = await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      expect(result.documents).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies projectId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        projectId: PROJECT_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(documentProjet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ project_id: PROJECT_ID }),
        }),
      );
    });

    it('applies livrableId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        livrableId: LIVRABLE_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(documentProjet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ livrable_id: LIVRABLE_ID }),
        }),
      );
    });

    it('applies statut filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        statut: DocumentStatus.VALIDE,
        orderBy: { created_at: 'desc' },
      });

      expect(documentProjet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statut: DocumentStatus.VALIDE }),
        }),
      );
    });

    it('builds OR search on titre and description', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        search: 'rapport',
        orderBy: { created_at: 'desc' },
      });

      expect(documentProjet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ titre: expect.objectContaining({ contains: 'rapport' }) }),
              expect.objectContaining({
                description: expect.objectContaining({ contains: 'rapport' }),
              }),
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

      expect(documentProjet.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls findFirst with the given id', async () => {
      await repo.findById(DOCUMENT_ID);

      expect(documentProjet.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: DOCUMENT_ID }) }),
      );
    });

    it('returns null when not found', async () => {
      documentProjet.findFirst.mockResolvedValueOnce(null);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  // ─── findByProject ───────────────────────────────────────────────────────────

  describe('findByProject()', () => {
    it('filters by project_id', async () => {
      await repo.findByProject(PROJECT_ID);

      expect(documentProjet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { project_id: PROJECT_ID } }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('maps camelCase to snake_case fields', async () => {
      await repo.create({ projectId: PROJECT_ID, titre: 'Rapport de démarrage' });

      expect(documentProjet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            project_id: PROJECT_ID,
            titre: 'Rapport de démarrage',
          }),
        }),
      );
    });

    it('stores optional livrableId', async () => {
      await repo.create({ projectId: PROJECT_ID, titre: 'Doc', livrableId: LIVRABLE_ID });

      expect(documentProjet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ livrable_id: LIVRABLE_ID }),
        }),
      );
    });

    it('stores createdBy from actor', async () => {
      await repo.create({ projectId: PROJECT_ID, titre: 'Doc', createdBy: 'admin-1' });

      expect(documentProjet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ created_by: 'admin-1' }),
        }),
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('calls prisma.update with the given id', async () => {
      await repo.update(DOCUMENT_ID, { statut: DocumentStatus.SOUMIS });

      expect(documentProjet.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: DOCUMENT_ID } }),
      );
    });

    it('passes statut on update', async () => {
      await repo.update(DOCUMENT_ID, { statut: DocumentStatus.VALIDE });

      expect(documentProjet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ statut: DocumentStatus.VALIDE }),
        }),
      );
    });

    it('passes updated_by on update', async () => {
      await repo.update(DOCUMENT_ID, { updatedBy: 'admin-1' });

      expect(documentProjet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ updated_by: 'admin-1' }),
        }),
      );
    });
  });

  // ─── softDelete ──────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('sets deleted_at via prisma.update (soft delete)', async () => {
      await repo.softDelete(DOCUMENT_ID);

      expect(documentProjet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: DOCUMENT_ID },
          data: expect.objectContaining({ deleted_at: expect.any(Date) }),
        }),
      );
    });
  });
});
