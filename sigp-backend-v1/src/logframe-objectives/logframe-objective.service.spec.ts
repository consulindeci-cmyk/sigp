import { AuditAction, LogframeLevel, LogframeObjective, Prisma } from '@prisma/client';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { LogframeObjectiveRepository } from './logframe-objective.repository';
import { LogframeObjectiveService } from './logframe-objective.service';
import { LogframeObjectiveQueryDto } from './dto/logframe-objective-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PROJ_ID = 'proj-001';

function buildObjective(overrides: Partial<LogframeObjective> = {}): LogframeObjective {
  return {
    id: 'obj-001',
    project_id: PROJ_ID,
    niveau: LogframeLevel.OBJECTIF_GLOBAL,
    code: 'OG-1',
    libelle: 'Améliorer l’accès aux soins',
    description: null,
    parent_id: null,
    ordre: 0,
    actif: true,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const logframeObjectiveRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<LogframeObjectiveRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJ_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new LogframeObjectiveService(
    logframeObjectiveRepository,
    projectService,
    auditService,
    eventEmitter,
  );

  return { service, logframeObjectiveRepository, projectService, auditService, eventEmitter };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('LogframeObjectiveService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.logframeObjectiveRepository.findManyPaginated.mockResolvedValue({
      objectives: [buildObjective()],
      total: 1,
    });
  });

  it('returns a paginated result of LogframeObjectiveResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new LogframeObjectiveQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].projectId).toBe(PROJ_ID);
  });

  it('forwards projectId, niveau, parentId and actif filters', async () => {
    const query = Object.assign(new LogframeObjectiveQueryDto(), {
      projectId: PROJ_ID,
      niveau: LogframeLevel.RESULTAT,
      parentId: 'par-1',
      actif: false,
    });
    await mocks.service.findAll(query);

    expect(mocks.logframeObjectiveRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJ_ID,
        niveau: LogframeLevel.RESULTAT,
        parentId: 'par-1',
        actif: false,
      }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new LogframeObjectiveQueryDto(), {
      sortBy: 'project_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.logframeObjectiveRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field (ordre)', async () => {
    const query = Object.assign(new LogframeObjectiveQueryDto(), {
      sortBy: 'ordre',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.logframeObjectiveRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { ordre: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('LogframeObjectiveService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a LogframeObjectiveResponseDto for an existing objective', async () => {
    mocks.logframeObjectiveRepository.findById.mockResolvedValue(buildObjective());

    const result = await mocks.service.findOne('obj-001');

    expect(result.id).toBe('obj-001');
    expect(result.code).toBe('OG-1');
  });

  it('throws LOGFRAME_OBJECTIVE_NOT_FOUND when the objective does not exist', async () => {
    mocks.logframeObjectiveRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.LOGFRAME_OBJECTIVE_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('LogframeObjectiveService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = {
    projectId: PROJ_ID,
    niveau: LogframeLevel.OBJECTIF_GLOBAL,
    code: 'OG-1',
    libelle: 'Améliorer l’accès aux soins',
  };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.logframeObjectiveRepository.create.mockResolvedValue(buildObjective());
  });

  it('verifies the project exists before creating', async () => {
    await mocks.service.create(dto);

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJ_ID);
    expect(mocks.logframeObjectiveRepository.create).toHaveBeenCalled();
  });

  it('propagates PROJECT_NOT_FOUND (404) when the project does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_NOT_FOUND,
    });
    expect(mocks.logframeObjectiveRepository.create).not.toHaveBeenCalled();
  });

  it('verifies the parent objective exists when parentId is provided', async () => {
    mocks.logframeObjectiveRepository.findById.mockResolvedValue(buildObjective({ id: 'par-1' }));

    await mocks.service.create({ ...dto, parentId: 'par-1' });

    expect(mocks.logframeObjectiveRepository.findById).toHaveBeenCalledWith('par-1');
  });

  it('throws PARENT_NOT_FOUND (404) when the parent objective does not exist', async () => {
    mocks.logframeObjectiveRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.create({ ...dto, parentId: 'ghost' })).rejects.toMatchObject({
      errorCode: ErrorCode.LOGFRAME_OBJECTIVE_PARENT_NOT_FOUND,
    });
    expect(mocks.logframeObjectiveRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 into a CONFLICT', async () => {
    mocks.logframeObjectiveRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });

  it('writes a CREATE audit log and emits LOGFRAME_OBJECTIVE_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'logframe_objectives',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.LOGFRAME_OBJECTIVE_CREATED,
      expect.objectContaining({ objectiveId: 'obj-001', projectId: PROJ_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('LogframeObjectiveService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.logframeObjectiveRepository.findById.mockResolvedValue(buildObjective());
    mocks.logframeObjectiveRepository.update.mockResolvedValue(
      buildObjective({ libelle: 'Nouveau' }),
    );
  });

  it('throws LOGFRAME_OBJECTIVE_NOT_FOUND when the objective does not exist', async () => {
    mocks.logframeObjectiveRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { libelle: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects self-parenting with a CONFLICT', async () => {
    await expect(mocks.service.update('obj-001', { parentId: 'obj-001' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(mocks.logframeObjectiveRepository.update).not.toHaveBeenCalled();
  });

  it('verifies a provided parent exists', async () => {
    mocks.logframeObjectiveRepository.findById
      .mockResolvedValueOnce(buildObjective()) // existing
      .mockResolvedValueOnce(null); // parent lookup

    await expect(mocks.service.update('obj-001', { parentId: 'ghost' })).rejects.toMatchObject({
      errorCode: ErrorCode.LOGFRAME_OBJECTIVE_PARENT_NOT_FOUND,
    });
  });

  it('writes an UPDATE audit log with avant/apres and emits LOGFRAME_OBJECTIVE_UPDATED', async () => {
    await mocks.service.update('obj-001', { libelle: 'Nouveau' }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'logframe_objectives',
        enregistrementId: 'obj-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.LOGFRAME_OBJECTIVE_UPDATED, {
      objectiveId: 'obj-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('LogframeObjectiveService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.logframeObjectiveRepository.findById.mockResolvedValue(buildObjective());
  });

  it('throws LOGFRAME_OBJECTIVE_NOT_FOUND when the objective does not exist', async () => {
    mocks.logframeObjectiveRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.logframeObjectiveRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('obj-001');

    expect(mocks.logframeObjectiveRepository.softDelete).toHaveBeenCalledWith('obj-001');
  });

  it('writes a DELETE audit log and emits LOGFRAME_OBJECTIVE_DELETED', async () => {
    await mocks.service.remove('obj-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'logframe_objectives' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.LOGFRAME_OBJECTIVE_DELETED, {
      objectiveId: 'obj-001',
    });
  });
});
