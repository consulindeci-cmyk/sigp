import { AuditAction, Departement, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DirectionService } from '@/directions/direction.service';
import { DepartementRepository } from './departement.repository';
import { DepartementService } from './departement.service';
import { DepartementQueryDto } from './dto/departement-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const DIR_ID = 'dir-001';

function buildDepartement(overrides: Partial<Departement> = {}): Departement {
  return {
    id: 'dep-001',
    direction_id: DIR_ID,
    code: 'DEP-SI',
    nom: 'Département SI',
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
  const departementRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<DepartementRepository>;

  const directionService = {
    findOne: jest.fn().mockResolvedValue({ id: DIR_ID }),
  } as unknown as jest.Mocked<DirectionService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new DepartementService(
    departementRepository,
    directionService,
    auditService,
    eventEmitter,
  );

  return { service, departementRepository, directionService, auditService, eventEmitter };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('DepartementService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.departementRepository.findManyPaginated.mockResolvedValue({
      departements: [buildDepartement()],
      total: 1,
    });
  });

  it('returns a paginated result of DepartementResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new DepartementQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].directionId).toBe(DIR_ID);
  });

  it('forwards directionId and actif filters to the repository', async () => {
    const query = Object.assign(new DepartementQueryDto(), { directionId: DIR_ID, actif: false });
    await mocks.service.findAll(query);

    expect(mocks.departementRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ directionId: DIR_ID, actif: false }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new DepartementQueryDto(), {
      sortBy: 'direction_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.departementRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field', async () => {
    const query = Object.assign(new DepartementQueryDto(), { sortBy: 'nom', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.departementRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { nom: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('DepartementService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a DepartementResponseDto for an existing département', async () => {
    mocks.departementRepository.findById.mockResolvedValue(buildDepartement());

    const result = await mocks.service.findOne('dep-001');

    expect(result.id).toBe('dep-001');
    expect(result.directionId).toBe(DIR_ID);
  });

  it('throws DEPARTEMENT_NOT_FOUND when the département does not exist', async () => {
    mocks.departementRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.DEPARTEMENT_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('DepartementService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { directionId: DIR_ID, code: 'DEP-SI', nom: 'Département SI' };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.departementRepository.findByCode.mockResolvedValue(null);
    mocks.departementRepository.findByName.mockResolvedValue(null);
    mocks.departementRepository.create.mockResolvedValue(buildDepartement());
  });

  it('verifies the parent direction exists before creating', async () => {
    await mocks.service.create(dto);

    expect(mocks.directionService.findOne).toHaveBeenCalledWith(DIR_ID);
    expect(mocks.departementRepository.create).toHaveBeenCalled();
  });

  it('propagates DIRECTION_NOT_FOUND (404) when the direction does not exist or is soft-deleted', async () => {
    mocks.directionService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.DIRECTION_NOT_FOUND, 'Direction introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.DIRECTION_NOT_FOUND,
    });
    expect(mocks.departementRepository.create).not.toHaveBeenCalled();
  });

  it('throws DEPARTEMENT_CODE_TAKEN when the code already exists in the direction', async () => {
    mocks.departementRepository.findByCode.mockResolvedValue(buildDepartement());

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.DEPARTEMENT_CODE_TAKEN,
    });
    expect(mocks.departementRepository.create).not.toHaveBeenCalled();
  });

  it('throws DEPARTEMENT_NAME_TAKEN when the name already exists in the direction', async () => {
    mocks.departementRepository.findByName.mockResolvedValue(buildDepartement({ code: 'OTHER' }));

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.DEPARTEMENT_NAME_TAKEN,
    });
    expect(mocks.departementRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 on nom into DEPARTEMENT_NAME_TAKEN', async () => {
    mocks.departementRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['direction_id', 'nom'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.DEPARTEMENT_NAME_TAKEN,
    });
  });

  it('translates a Prisma P2002 on code into DEPARTEMENT_CODE_TAKEN', async () => {
    mocks.departementRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['direction_id', 'code'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.DEPARTEMENT_CODE_TAKEN,
    });
  });

  it('writes a CREATE audit log and emits DEPARTEMENT_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'departements',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.DEPARTEMENT_CREATED,
      expect.objectContaining({ departementId: 'dep-001', directionId: DIR_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('DepartementService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.departementRepository.findById.mockResolvedValue(buildDepartement());
    mocks.departementRepository.findByName.mockResolvedValue(null);
    mocks.departementRepository.update.mockResolvedValue(buildDepartement({ nom: 'Nouveau nom' }));
  });

  it('throws DEPARTEMENT_NOT_FOUND when the département does not exist', async () => {
    mocks.departementRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { nom: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('checks name uniqueness within the same direction and throws on collision', async () => {
    mocks.departementRepository.findByName.mockResolvedValue(buildDepartement({ id: 'other' }));

    await expect(mocks.service.update('dep-001', { nom: 'Déjà pris' })).rejects.toMatchObject({
      errorCode: ErrorCode.DEPARTEMENT_NAME_TAKEN,
    });
    expect(mocks.departementRepository.findByName).toHaveBeenCalledWith(DIR_ID, 'Déjà pris');
    expect(mocks.departementRepository.update).not.toHaveBeenCalled();
  });

  it('does not check name uniqueness when the name is unchanged', async () => {
    await mocks.service.update('dep-001', { nom: 'Département SI', actif: false });

    expect(mocks.departementRepository.findByName).not.toHaveBeenCalled();
    expect(mocks.departementRepository.update).toHaveBeenCalled();
  });

  it('writes an UPDATE audit log with avant/apres and emits DEPARTEMENT_UPDATED', async () => {
    await mocks.service.update('dep-001', { nom: 'Nouveau nom' }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'departements',
        enregistrementId: 'dep-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.DEPARTEMENT_UPDATED, {
      departementId: 'dep-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('DepartementService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.departementRepository.findById.mockResolvedValue(buildDepartement());
  });

  it('throws DEPARTEMENT_NOT_FOUND when the département does not exist', async () => {
    mocks.departementRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.departementRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('dep-001');

    expect(mocks.departementRepository.softDelete).toHaveBeenCalledWith('dep-001');
  });

  it('writes a DELETE audit log and emits DEPARTEMENT_DELETED', async () => {
    await mocks.service.remove('dep-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'departements' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.DEPARTEMENT_DELETED, {
      departementId: 'dep-001',
    });
  });
});
