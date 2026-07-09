import { AuditAction, Livrable, LivrableStatus } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { LivrableRepository } from './livrable.repository';
import { LivrableService } from './livrable.service';
import { LivrableQueryDto } from './dto/livrable-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

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

function buildMocks() {
  const livrableRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<LivrableRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJECT_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new LivrableService(
    livrableRepository,
    projectService,
    auditService,
    eventEmitter,
  );

  return { service, livrableRepository, projectService, auditService, eventEmitter };
}

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('LivrableService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.livrableRepository.findManyPaginated.mockResolvedValue({
      livrables: [buildLivrable()],
      total: 1,
    });
  });

  it('returns a paginated result with mapped fields', async () => {
    const result = await mocks.service.findAll(new LivrableQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0].projectId).toBe(PROJECT_ID);
    expect(result.data[0].nom).toBe('Rapport de lancement');
    expect(result.data[0].statut).toBe(LivrableStatus.NON_COMMENCE);
  });

  it('forwards projectId and statut filters to the repository', async () => {
    const query = Object.assign(new LivrableQueryDto(), {
      projectId: PROJECT_ID,
      statut: LivrableStatus.EN_COURS,
    });
    await mocks.service.findAll(query);

    expect(mocks.livrableRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        statut: LivrableStatus.EN_COURS,
      }),
    );
  });

  it('falls back to created_at when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new LivrableQueryDto(), {
      sortBy: 'project_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.livrableRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (nom)', async () => {
    const query = Object.assign(new LivrableQueryDto(), { sortBy: 'nom', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.livrableRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { nom: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (date_prevue)', async () => {
    const query = Object.assign(new LivrableQueryDto(), {
      sortBy: 'date_prevue',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.livrableRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { date_prevue: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (statut)', async () => {
    const query = Object.assign(new LivrableQueryDto(), { sortBy: 'statut', sortOrder: 'desc' });
    await mocks.service.findAll(query);

    expect(mocks.livrableRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { statut: 'desc' } }),
    );
  });
});

// ─── findOne ─────────────────────────────────────────────────────────────────

describe('LivrableService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a LivrableResponseDto for an existing livrable', async () => {
    mocks.livrableRepository.findById.mockResolvedValue(buildLivrable());

    const result = await mocks.service.findOne(LIVRABLE_ID);

    expect(result.id).toBe(LIVRABLE_ID);
    expect(result.projectId).toBe(PROJECT_ID);
    expect(result.nom).toBe('Rapport de lancement');
  });

  it('throws LIVRABLE_NOT_FOUND when it does not exist', async () => {
    mocks.livrableRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.LIVRABLE_NOT_FOUND,
    });
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('LivrableService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.livrableRepository.create.mockResolvedValue(buildLivrable());
  });

  it('creates a livrable after validating the project', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      nom: 'Rapport de lancement',
    });

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJECT_ID);
    expect(mocks.livrableRepository.create).toHaveBeenCalled();
  });

  it('throws 404 when projectId does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(
      mocks.service.create({ projectId: PROJECT_ID, nom: 'Rapport' }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PROJECT_NOT_FOUND });
    expect(mocks.livrableRepository.create).not.toHaveBeenCalled();
  });

  it('converts date strings to Date objects', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      nom: 'Livrable test',
      datePrevue: '2026-06-01',
      dateSoumission: '2026-07-01',
      dateValidation: '2026-07-15',
    });

    expect(mocks.livrableRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        datePrevue: new Date('2026-06-01'),
        dateSoumission: new Date('2026-07-01'),
        dateValidation: new Date('2026-07-15'),
      }),
    );
  });

  it('passes null dates when not provided', async () => {
    await mocks.service.create({ projectId: PROJECT_ID, nom: 'Livrable test' });

    expect(mocks.livrableRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        datePrevue: null,
        dateSoumission: null,
        dateValidation: null,
      }),
    );
  });

  it('writes a CREATE audit log and emits LIVRABLE_CREATED', async () => {
    await mocks.service.create(
      { projectId: PROJECT_ID, nom: 'Rapport' },
      { userId: 'admin-1', ip: '127.0.0.1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'livrables',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.LIVRABLE_CREATED,
      expect.objectContaining({ livrableId: LIVRABLE_ID }),
    );
  });

  it('passes createdBy from actor userId', async () => {
    await mocks.service.create({ projectId: PROJECT_ID, nom: 'Rapport' }, { userId: 'admin-1' });

    expect(mocks.livrableRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'admin-1' }),
    );
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('LivrableService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.livrableRepository.findById.mockResolvedValue(buildLivrable());
    mocks.livrableRepository.update.mockResolvedValue(
      buildLivrable({ statut: LivrableStatus.EN_COURS }),
    );
  });

  it('throws LIVRABLE_NOT_FOUND when it does not exist', async () => {
    mocks.livrableRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('converts date strings to Date objects on update', async () => {
    await mocks.service.update(LIVRABLE_ID, { datePrevue: '2026-09-01' });

    expect(mocks.livrableRepository.update).toHaveBeenCalledWith(
      LIVRABLE_ID,
      expect.objectContaining({ datePrevue: new Date('2026-09-01') }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits LIVRABLE_UPDATED', async () => {
    await mocks.service.update(
      LIVRABLE_ID,
      { statut: LivrableStatus.EN_COURS },
      { userId: 'admin-1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'livrables',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.LIVRABLE_UPDATED, {
      livrableId: LIVRABLE_ID,
    });
  });

  it('emits LIVRABLE_STATUS_CHANGED when statut changes', async () => {
    await mocks.service.update(LIVRABLE_ID, { statut: LivrableStatus.EN_COURS });

    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.LIVRABLE_STATUS_CHANGED,
      expect.objectContaining({
        livrableId: LIVRABLE_ID,
        oldStatut: LivrableStatus.NON_COMMENCE,
        newStatut: LivrableStatus.EN_COURS,
      }),
    );
  });

  it('does NOT emit LIVRABLE_STATUS_CHANGED when statut is unchanged', async () => {
    await mocks.service.update(LIVRABLE_ID, { statut: LivrableStatus.NON_COMMENCE });

    const statusEmits = (mocks.eventEmitter.emit as jest.Mock).mock.calls.filter(
      ([event]) => event === AppEvent.LIVRABLE_STATUS_CHANGED,
    );
    expect(statusEmits).toHaveLength(0);
  });

  it('emits LIVRABLE_SUBMITTED when statut transitions to SOUMIS', async () => {
    mocks.livrableRepository.update.mockResolvedValue(
      buildLivrable({ statut: LivrableStatus.SOUMIS }),
    );

    await mocks.service.update(LIVRABLE_ID, { statut: LivrableStatus.SOUMIS });

    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.LIVRABLE_SUBMITTED,
      expect.objectContaining({ livrableId: LIVRABLE_ID }),
    );
  });

  it('does NOT emit LIVRABLE_SUBMITTED when statut is not SOUMIS', async () => {
    await mocks.service.update(LIVRABLE_ID, { statut: LivrableStatus.EN_COURS });

    const submittedEmits = (mocks.eventEmitter.emit as jest.Mock).mock.calls.filter(
      ([event]) => event === AppEvent.LIVRABLE_SUBMITTED,
    );
    expect(submittedEmits).toHaveLength(0);
  });

  it('passes updatedBy from actor userId', async () => {
    await mocks.service.update(LIVRABLE_ID, { nom: 'Updated' }, { userId: 'admin-1' });

    expect(mocks.livrableRepository.update).toHaveBeenCalledWith(
      LIVRABLE_ID,
      expect.objectContaining({ updatedBy: 'admin-1' }),
    );
  });
});

// ─── remove ──────────────────────────────────────────────────────────────────

describe('LivrableService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.livrableRepository.findById.mockResolvedValue(buildLivrable());
  });

  it('throws LIVRABLE_NOT_FOUND when it does not exist', async () => {
    mocks.livrableRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.livrableRepository.softDelete).not.toHaveBeenCalled();
  });

  it('soft-deletes the livrable via the repository', async () => {
    await mocks.service.remove(LIVRABLE_ID);

    expect(mocks.livrableRepository.softDelete).toHaveBeenCalledWith(LIVRABLE_ID);
  });

  it('writes a DELETE audit log and emits LIVRABLE_DELETED', async () => {
    await mocks.service.remove(LIVRABLE_ID, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'livrables' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.LIVRABLE_DELETED,
      expect.objectContaining({ livrableId: LIVRABLE_ID }),
    );
  });
});
