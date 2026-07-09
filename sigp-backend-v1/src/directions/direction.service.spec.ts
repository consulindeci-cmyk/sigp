import { AuditAction, Direction, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrganisationService } from '@/organisations/organisation.service';
import { DirectionRepository } from './direction.repository';
import { DirectionService } from './direction.service';
import { DirectionQueryDto } from './dto/direction-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const ORG_ID = 'org-001';

function buildDirection(overrides: Partial<Direction> = {}): Direction {
  return {
    id: 'dir-001',
    organisation_id: ORG_ID,
    code: 'DIR-TECH',
    nom: 'Direction Technique',
    description: null,
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
  const directionRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<DirectionRepository>;

  const organisationService = {
    findOne: jest.fn().mockResolvedValue({ id: ORG_ID }),
  } as unknown as jest.Mocked<OrganisationService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new DirectionService(
    directionRepository,
    organisationService,
    auditService,
    eventEmitter,
  );

  return { service, directionRepository, organisationService, auditService, eventEmitter };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('DirectionService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.directionRepository.findManyPaginated.mockResolvedValue({
      directions: [buildDirection()],
      total: 1,
    });
  });

  it('returns a paginated result of DirectionResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new DirectionQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].organisationId).toBe(ORG_ID);
  });

  it('forwards organisationId and actif filters to the repository', async () => {
    const query = Object.assign(new DirectionQueryDto(), { organisationId: ORG_ID, actif: false });
    await mocks.service.findAll(query);

    expect(mocks.directionRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ organisationId: ORG_ID, actif: false }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new DirectionQueryDto(), {
      sortBy: 'organisation_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.directionRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field', async () => {
    const query = Object.assign(new DirectionQueryDto(), { sortBy: 'code', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.directionRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { code: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('DirectionService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a DirectionResponseDto for an existing direction', async () => {
    mocks.directionRepository.findById.mockResolvedValue(buildDirection());

    const result = await mocks.service.findOne('dir-001');

    expect(result.id).toBe('dir-001');
    expect(result.organisationId).toBe(ORG_ID);
  });

  it('throws DIRECTION_NOT_FOUND when the direction does not exist', async () => {
    mocks.directionRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.DIRECTION_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('DirectionService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { organisationId: ORG_ID, code: 'DIR-TECH', nom: 'Direction Technique' };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.directionRepository.findByCode.mockResolvedValue(null);
    mocks.directionRepository.findByName.mockResolvedValue(null);
    mocks.directionRepository.create.mockResolvedValue(buildDirection());
  });

  it('verifies the parent organisation exists before creating', async () => {
    await mocks.service.create(dto);

    expect(mocks.organisationService.findOne).toHaveBeenCalledWith(ORG_ID);
    expect(mocks.directionRepository.create).toHaveBeenCalled();
  });

  it('propagates ORGANISATION_NOT_FOUND (404) when the organisation does not exist', async () => {
    mocks.organisationService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.ORGANISATION_NOT_FOUND, 'Organisation introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.ORGANISATION_NOT_FOUND,
    });
    expect(mocks.directionRepository.create).not.toHaveBeenCalled();
  });

  it('throws DIRECTION_CODE_TAKEN when the code already exists in the organisation', async () => {
    mocks.directionRepository.findByCode.mockResolvedValue(buildDirection());

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.DIRECTION_CODE_TAKEN,
    });
    expect(mocks.directionRepository.create).not.toHaveBeenCalled();
  });

  it('throws DIRECTION_NAME_TAKEN when the name already exists in the organisation', async () => {
    mocks.directionRepository.findByName.mockResolvedValue(buildDirection({ code: 'OTHER' }));

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.DIRECTION_NAME_TAKEN,
    });
    expect(mocks.directionRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 on nom into DIRECTION_NAME_TAKEN', async () => {
    mocks.directionRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['organisation_id', 'nom'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.DIRECTION_NAME_TAKEN,
    });
  });

  it('translates a Prisma P2002 on code into DIRECTION_CODE_TAKEN', async () => {
    mocks.directionRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['organisation_id', 'code'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.DIRECTION_CODE_TAKEN,
    });
  });

  it('writes a CREATE audit log and emits DIRECTION_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'directions',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.DIRECTION_CREATED,
      expect.objectContaining({ directionId: 'dir-001', organisationId: ORG_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('DirectionService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.directionRepository.findById.mockResolvedValue(buildDirection());
    mocks.directionRepository.findByName.mockResolvedValue(null);
    mocks.directionRepository.update.mockResolvedValue(buildDirection({ nom: 'Nouveau nom' }));
  });

  it('throws DIRECTION_NOT_FOUND when the direction does not exist', async () => {
    mocks.directionRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { nom: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('checks name uniqueness within the same organisation and throws on collision', async () => {
    mocks.directionRepository.findByName.mockResolvedValue(buildDirection({ id: 'other' }));

    await expect(mocks.service.update('dir-001', { nom: 'Déjà pris' })).rejects.toMatchObject({
      errorCode: ErrorCode.DIRECTION_NAME_TAKEN,
    });
    // La collision de nom est vérifiée dans l'organisation de la direction existante
    expect(mocks.directionRepository.findByName).toHaveBeenCalledWith(ORG_ID, 'Déjà pris');
    expect(mocks.directionRepository.update).not.toHaveBeenCalled();
  });

  it('does not check name uniqueness when the name is unchanged', async () => {
    await mocks.service.update('dir-001', { nom: 'Direction Technique', actif: false });

    expect(mocks.directionRepository.findByName).not.toHaveBeenCalled();
    expect(mocks.directionRepository.update).toHaveBeenCalled();
  });

  it('writes an UPDATE audit log with avant/apres and emits DIRECTION_UPDATED', async () => {
    await mocks.service.update('dir-001', { nom: 'Nouveau nom' }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'directions',
        enregistrementId: 'dir-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.DIRECTION_UPDATED, {
      directionId: 'dir-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('DirectionService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.directionRepository.findById.mockResolvedValue(buildDirection());
  });

  it('throws DIRECTION_NOT_FOUND when the direction does not exist', async () => {
    mocks.directionRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.directionRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('dir-001');

    expect(mocks.directionRepository.softDelete).toHaveBeenCalledWith('dir-001');
  });

  it('writes a DELETE audit log and emits DIRECTION_DELETED', async () => {
    await mocks.service.remove('dir-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'directions' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.DIRECTION_DELETED, {
      directionId: 'dir-001',
    });
  });
});
