import { AuditAction, DocumentProjet, DocumentStatus } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { DocumentRepository } from './document.repository';
import { DocumentService } from './document.service';
import { DocumentQueryDto } from './dto/document-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

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

function buildMocks() {
  const documentRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<DocumentRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJECT_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new DocumentService(
    documentRepository,
    projectService,
    auditService,
    eventEmitter,
  );

  return { service, documentRepository, projectService, auditService, eventEmitter };
}

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('DocumentService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.documentRepository.findManyPaginated.mockResolvedValue({
      documents: [buildDocument()],
      total: 1,
    });
  });

  it('returns a paginated result with mapped fields', async () => {
    const result = await mocks.service.findAll(new DocumentQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0].projectId).toBe(PROJECT_ID);
    expect(result.data[0].titre).toBe('Rapport de démarrage');
    expect(result.data[0].statut).toBe(DocumentStatus.BROUILLON);
  });

  it('forwards all query filters to the repository', async () => {
    const query = Object.assign(new DocumentQueryDto(), {
      projectId: PROJECT_ID,
      livrableId: LIVRABLE_ID,
      statut: DocumentStatus.VALIDE,
    });
    await mocks.service.findAll(query);

    expect(mocks.documentRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        livrableId: LIVRABLE_ID,
        statut: DocumentStatus.VALIDE,
      }),
    );
  });

  it('falls back to created_at when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new DocumentQueryDto(), {
      sortBy: 'project_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.documentRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (titre)', async () => {
    const query = Object.assign(new DocumentQueryDto(), { sortBy: 'titre', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.documentRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { titre: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (statut)', async () => {
    const query = Object.assign(new DocumentQueryDto(), { sortBy: 'statut', sortOrder: 'desc' });
    await mocks.service.findAll(query);

    expect(mocks.documentRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { statut: 'desc' } }),
    );
  });

  it('honours whitelisted sort field (updated_at)', async () => {
    const query = Object.assign(new DocumentQueryDto(), {
      sortBy: 'updated_at',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.documentRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { updated_at: 'asc' } }),
    );
  });
});

// ─── findOne ─────────────────────────────────────────────────────────────────

describe('DocumentService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a DocumentResponseDto for an existing document', async () => {
    mocks.documentRepository.findById.mockResolvedValue(buildDocument());

    const result = await mocks.service.findOne(DOCUMENT_ID);

    expect(result.id).toBe(DOCUMENT_ID);
    expect(result.projectId).toBe(PROJECT_ID);
    expect(result.titre).toBe('Rapport de démarrage');
  });

  it('throws DOCUMENT_NOT_FOUND when it does not exist', async () => {
    mocks.documentRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
    });
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('DocumentService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.documentRepository.create.mockResolvedValue(buildDocument());
  });

  it('creates a document after validating the project', async () => {
    await mocks.service.create({ projectId: PROJECT_ID, titre: 'Rapport' });

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJECT_ID);
    expect(mocks.documentRepository.create).toHaveBeenCalled();
  });

  it('throws 404 when projectId does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(
      mocks.service.create({ projectId: PROJECT_ID, titre: 'Rapport' }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PROJECT_NOT_FOUND });
    expect(mocks.documentRepository.create).not.toHaveBeenCalled();
  });

  it('passes livrableId when provided', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      titre: 'Rapport',
      livrableId: LIVRABLE_ID,
    });

    expect(mocks.documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ livrableId: LIVRABLE_ID }),
    );
  });

  it('passes null livrableId when not provided', async () => {
    await mocks.service.create({ projectId: PROJECT_ID, titre: 'Rapport' });

    expect(mocks.documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ livrableId: null }),
    );
  });

  it('writes a CREATE audit log and emits DOCUMENT_CREATED', async () => {
    await mocks.service.create(
      { projectId: PROJECT_ID, titre: 'Rapport' },
      { userId: 'admin-1', ip: '127.0.0.1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'documents_projet',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.DOCUMENT_CREATED,
      expect.objectContaining({ documentId: DOCUMENT_ID }),
    );
  });

  it('passes createdBy from actor userId', async () => {
    await mocks.service.create({ projectId: PROJECT_ID, titre: 'Rapport' }, { userId: 'admin-1' });

    expect(mocks.documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'admin-1' }),
    );
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('DocumentService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.documentRepository.findById.mockResolvedValue(buildDocument());
    mocks.documentRepository.update.mockResolvedValue(
      buildDocument({ statut: DocumentStatus.SOUMIS }),
    );
  });

  it('throws DOCUMENT_NOT_FOUND when it does not exist', async () => {
    mocks.documentRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('writes an UPDATE audit log with avant/apres and emits DOCUMENT_UPDATED', async () => {
    await mocks.service.update(
      DOCUMENT_ID,
      { statut: DocumentStatus.SOUMIS },
      { userId: 'admin-1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'documents_projet',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.DOCUMENT_UPDATED, {
      documentId: DOCUMENT_ID,
    });
  });

  it('emits DOCUMENT_VALIDATED when statut transitions to VALIDE', async () => {
    mocks.documentRepository.update.mockResolvedValue(
      buildDocument({ statut: DocumentStatus.VALIDE }),
    );

    await mocks.service.update(DOCUMENT_ID, { statut: DocumentStatus.VALIDE });

    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.DOCUMENT_VALIDATED,
      expect.objectContaining({ documentId: DOCUMENT_ID }),
    );
  });

  it('emits DOCUMENT_REJECTED when statut transitions to REJETE', async () => {
    mocks.documentRepository.update.mockResolvedValue(
      buildDocument({ statut: DocumentStatus.REJETE }),
    );

    await mocks.service.update(DOCUMENT_ID, { statut: DocumentStatus.REJETE });

    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.DOCUMENT_REJECTED,
      expect.objectContaining({ documentId: DOCUMENT_ID }),
    );
  });

  it('does NOT emit DOCUMENT_VALIDATED when statut is unchanged', async () => {
    await mocks.service.update(DOCUMENT_ID, { statut: DocumentStatus.BROUILLON });

    const validatedEmits = (mocks.eventEmitter.emit as jest.Mock).mock.calls.filter(
      ([event]) => event === AppEvent.DOCUMENT_VALIDATED,
    );
    expect(validatedEmits).toHaveLength(0);
  });

  it('passes updatedBy from actor userId', async () => {
    await mocks.service.update(DOCUMENT_ID, { titre: 'Updated' }, { userId: 'admin-1' });

    expect(mocks.documentRepository.update).toHaveBeenCalledWith(
      DOCUMENT_ID,
      expect.objectContaining({ updatedBy: 'admin-1' }),
    );
  });
});

// ─── remove ──────────────────────────────────────────────────────────────────

describe('DocumentService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.documentRepository.findById.mockResolvedValue(buildDocument());
  });

  it('throws DOCUMENT_NOT_FOUND when it does not exist', async () => {
    mocks.documentRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.documentRepository.softDelete).not.toHaveBeenCalled();
  });

  it('soft-deletes the document via the repository', async () => {
    await mocks.service.remove(DOCUMENT_ID);

    expect(mocks.documentRepository.softDelete).toHaveBeenCalledWith(DOCUMENT_ID);
  });

  it('writes a DELETE audit log and emits DOCUMENT_DELETED', async () => {
    await mocks.service.remove(DOCUMENT_ID, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'documents_projet' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.DOCUMENT_DELETED,
      expect.objectContaining({ documentId: DOCUMENT_ID }),
    );
  });
});
