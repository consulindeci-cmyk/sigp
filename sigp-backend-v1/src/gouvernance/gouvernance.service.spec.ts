import { AuditAction, Gouvernance, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { UsersService } from '@/users/users.service';
import { GouvernanceRepository } from './gouvernance.repository';
import { GouvernanceService } from './gouvernance.service';
import { GouvernanceQueryDto } from './dto/gouvernance-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PROJ_ID = 'proj-001';

function buildEntry(overrides: Partial<Gouvernance> = {}): Gouvernance {
  return {
    id: 'gov-001',
    project_id: PROJ_ID,
    nom: 'Awa Koné',
    role: 'Président',
    organisation: null,
    email: null,
    telephone: null,
    user_id: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const gouvernanceRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<GouvernanceRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJ_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const usersService = {
    findOne: jest.fn().mockResolvedValue({ id: 'usr-1' }),
  } as unknown as jest.Mocked<UsersService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new GouvernanceService(
    gouvernanceRepository,
    projectService,
    usersService,
    auditService,
    eventEmitter,
  );

  return {
    service,
    gouvernanceRepository,
    projectService,
    usersService,
    auditService,
    eventEmitter,
  };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('GouvernanceService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.gouvernanceRepository.findManyPaginated.mockResolvedValue({
      entries: [buildEntry()],
      total: 1,
    });
  });

  it('returns a paginated result of GouvernanceResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new GouvernanceQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].projectId).toBe(PROJ_ID);
  });

  it('forwards projectId and userId filters to the repository', async () => {
    const query = Object.assign(new GouvernanceQueryDto(), { projectId: PROJ_ID, userId: 'usr-1' });
    await mocks.service.findAll(query);

    expect(mocks.gouvernanceRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: PROJ_ID, userId: 'usr-1' }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new GouvernanceQueryDto(), {
      sortBy: 'project_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.gouvernanceRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field', async () => {
    const query = Object.assign(new GouvernanceQueryDto(), { sortBy: 'nom', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.gouvernanceRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { nom: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('GouvernanceService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a GouvernanceResponseDto for an existing entry', async () => {
    mocks.gouvernanceRepository.findById.mockResolvedValue(buildEntry());

    const result = await mocks.service.findOne('gov-001');

    expect(result.id).toBe('gov-001');
    expect(result.role).toBe('Président');
  });

  it('throws GOUVERNANCE_NOT_FOUND when the entry does not exist', async () => {
    mocks.gouvernanceRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.GOUVERNANCE_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('GouvernanceService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { projectId: PROJ_ID, nom: 'Awa Koné', role: 'Président' };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.gouvernanceRepository.create.mockResolvedValue(buildEntry());
  });

  it('verifies the project exists before creating', async () => {
    await mocks.service.create(dto);

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJ_ID);
    expect(mocks.gouvernanceRepository.create).toHaveBeenCalled();
  });

  it('propagates PROJECT_NOT_FOUND (404) when the project does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_NOT_FOUND,
    });
    expect(mocks.gouvernanceRepository.create).not.toHaveBeenCalled();
  });

  it('verifies the linked user exists when userId is provided', async () => {
    await mocks.service.create({ ...dto, userId: 'usr-1' });

    expect(mocks.usersService.findOne).toHaveBeenCalledWith('usr-1');
  });

  it('propagates USER_NOT_FOUND (404) when the linked user does not exist', async () => {
    mocks.usersService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.USER_NOT_FOUND, 'Utilisateur introuvable'),
    );

    await expect(mocks.service.create({ ...dto, userId: 'ghost' })).rejects.toMatchObject({
      errorCode: ErrorCode.USER_NOT_FOUND,
    });
    expect(mocks.gouvernanceRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 into a CONFLICT', async () => {
    mocks.gouvernanceRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });

  it('writes a CREATE audit log and emits GOUVERNANCE_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'gouvernance',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.GOUVERNANCE_CREATED,
      expect.objectContaining({ gouvernanceId: 'gov-001', projectId: PROJ_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('GouvernanceService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.gouvernanceRepository.findById.mockResolvedValue(buildEntry());
    mocks.gouvernanceRepository.update.mockResolvedValue(buildEntry({ nom: 'Nouveau nom' }));
  });

  it('throws GOUVERNANCE_NOT_FOUND when the entry does not exist', async () => {
    mocks.gouvernanceRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { nom: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('verifies the linked user when userId is provided', async () => {
    await mocks.service.update('gov-001', { userId: 'usr-9' });

    expect(mocks.usersService.findOne).toHaveBeenCalledWith('usr-9');
    expect(mocks.gouvernanceRepository.update).toHaveBeenCalled();
  });

  it('writes an UPDATE audit log with avant/apres and emits GOUVERNANCE_UPDATED', async () => {
    await mocks.service.update('gov-001', { nom: 'Nouveau nom' }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'gouvernance',
        enregistrementId: 'gov-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.GOUVERNANCE_UPDATED, {
      gouvernanceId: 'gov-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('GouvernanceService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.gouvernanceRepository.findById.mockResolvedValue(buildEntry());
  });

  it('throws GOUVERNANCE_NOT_FOUND when the entry does not exist', async () => {
    mocks.gouvernanceRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.gouvernanceRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('gov-001');

    expect(mocks.gouvernanceRepository.softDelete).toHaveBeenCalledWith('gov-001');
  });

  it('writes a DELETE audit log and emits GOUVERNANCE_DELETED', async () => {
    await mocks.service.remove('gov-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'gouvernance' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.GOUVERNANCE_DELETED, {
      gouvernanceId: 'gov-001',
    });
  });
});
