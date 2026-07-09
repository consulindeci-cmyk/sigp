import { AuditAction, Prisma, Unite } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DepartementService } from '@/departements/departement.service';
import { UniteRepository } from './unite.repository';
import { UniteService } from './unite.service';
import { UniteQueryDto } from './dto/unite-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const DEP_ID = 'dep-001';

function buildUnite(overrides: Partial<Unite> = {}): Unite {
  return {
    id: 'uni-001',
    departement_id: DEP_ID,
    code: 'UNI-RESEAU',
    nom: 'Unité Réseau',
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
  const uniteRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<UniteRepository>;

  const departementService = {
    findOne: jest.fn().mockResolvedValue({ id: DEP_ID }),
  } as unknown as jest.Mocked<DepartementService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new UniteService(uniteRepository, departementService, auditService, eventEmitter);

  return { service, uniteRepository, departementService, auditService, eventEmitter };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('UniteService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.uniteRepository.findManyPaginated.mockResolvedValue({
      unites: [buildUnite()],
      total: 1,
    });
  });

  it('returns a paginated result of UniteResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new UniteQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].departementId).toBe(DEP_ID);
  });

  it('forwards departementId and actif filters to the repository', async () => {
    const query = Object.assign(new UniteQueryDto(), { departementId: DEP_ID, actif: false });
    await mocks.service.findAll(query);

    expect(mocks.uniteRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ departementId: DEP_ID, actif: false }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new UniteQueryDto(), {
      sortBy: 'departement_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.uniteRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field', async () => {
    const query = Object.assign(new UniteQueryDto(), { sortBy: 'code', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.uniteRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { code: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('UniteService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a UniteResponseDto for an existing unité', async () => {
    mocks.uniteRepository.findById.mockResolvedValue(buildUnite());

    const result = await mocks.service.findOne('uni-001');

    expect(result.id).toBe('uni-001');
    expect(result.departementId).toBe(DEP_ID);
  });

  it('throws UNITE_NOT_FOUND when the unité does not exist', async () => {
    mocks.uniteRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.UNITE_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('UniteService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { departementId: DEP_ID, code: 'UNI-RESEAU', nom: 'Unité Réseau' };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.uniteRepository.findByCode.mockResolvedValue(null);
    mocks.uniteRepository.findByName.mockResolvedValue(null);
    mocks.uniteRepository.create.mockResolvedValue(buildUnite());
  });

  it('verifies the parent département exists before creating', async () => {
    await mocks.service.create(dto);

    expect(mocks.departementService.findOne).toHaveBeenCalledWith(DEP_ID);
    expect(mocks.uniteRepository.create).toHaveBeenCalled();
  });

  it('propagates DEPARTEMENT_NOT_FOUND (404) when the département does not exist or is soft-deleted', async () => {
    mocks.departementService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.DEPARTEMENT_NOT_FOUND, 'Département introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.DEPARTEMENT_NOT_FOUND,
    });
    expect(mocks.uniteRepository.create).not.toHaveBeenCalled();
  });

  it('throws UNITE_CODE_TAKEN when the code already exists in the département', async () => {
    mocks.uniteRepository.findByCode.mockResolvedValue(buildUnite());

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.UNITE_CODE_TAKEN,
    });
    expect(mocks.uniteRepository.create).not.toHaveBeenCalled();
  });

  it('throws UNITE_NAME_TAKEN when the name already exists in the département', async () => {
    mocks.uniteRepository.findByName.mockResolvedValue(buildUnite({ code: 'OTHER' }));

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.UNITE_NAME_TAKEN,
    });
    expect(mocks.uniteRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 on nom into UNITE_NAME_TAKEN', async () => {
    mocks.uniteRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['departement_id', 'nom'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.UNITE_NAME_TAKEN,
    });
  });

  it('translates a Prisma P2002 on code into UNITE_CODE_TAKEN', async () => {
    mocks.uniteRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['departement_id', 'code'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.UNITE_CODE_TAKEN,
    });
  });

  it('writes a CREATE audit log and emits UNITE_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'unites',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.UNITE_CREATED,
      expect.objectContaining({ uniteId: 'uni-001', departementId: DEP_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('UniteService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.uniteRepository.findById.mockResolvedValue(buildUnite());
    mocks.uniteRepository.findByName.mockResolvedValue(null);
    mocks.uniteRepository.update.mockResolvedValue(buildUnite({ nom: 'Nouveau nom' }));
  });

  it('throws UNITE_NOT_FOUND when the unité does not exist', async () => {
    mocks.uniteRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { nom: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('checks name uniqueness within the same département and throws on collision', async () => {
    mocks.uniteRepository.findByName.mockResolvedValue(buildUnite({ id: 'other' }));

    await expect(mocks.service.update('uni-001', { nom: 'Déjà pris' })).rejects.toMatchObject({
      errorCode: ErrorCode.UNITE_NAME_TAKEN,
    });
    expect(mocks.uniteRepository.findByName).toHaveBeenCalledWith(DEP_ID, 'Déjà pris');
    expect(mocks.uniteRepository.update).not.toHaveBeenCalled();
  });

  it('does not check name uniqueness when the name is unchanged', async () => {
    await mocks.service.update('uni-001', { nom: 'Unité Réseau', actif: false });

    expect(mocks.uniteRepository.findByName).not.toHaveBeenCalled();
    expect(mocks.uniteRepository.update).toHaveBeenCalled();
  });

  it('writes an UPDATE audit log with avant/apres and emits UNITE_UPDATED', async () => {
    await mocks.service.update('uni-001', { nom: 'Nouveau nom' }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'unites',
        enregistrementId: 'uni-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.UNITE_UPDATED, {
      uniteId: 'uni-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('UniteService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.uniteRepository.findById.mockResolvedValue(buildUnite());
  });

  it('throws UNITE_NOT_FOUND when the unité does not exist', async () => {
    mocks.uniteRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.uniteRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('uni-001');

    expect(mocks.uniteRepository.softDelete).toHaveBeenCalledWith('uni-001');
  });

  it('writes a DELETE audit log and emits UNITE_DELETED', async () => {
    await mocks.service.remove('uni-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'unites' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.UNITE_DELETED, {
      uniteId: 'uni-001',
    });
  });
});
