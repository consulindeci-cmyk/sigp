import { AuditAction, Prisma, Programme, ProgrammeStatus } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UniteService } from '@/unites/unite.service';
import { ProgrammeRepository } from './programme.repository';
import { ProgrammeService } from './programme.service';
import { ProgrammeQueryDto } from './dto/programme-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const UNI_ID = 'uni-001';

function buildProgramme(overrides: Partial<Programme> = {}): Programme {
  return {
    id: 'prg-001',
    unite_id: UNI_ID,
    code: 'PRG-SANTE',
    nom: 'Programme Santé',
    description: null,
    statut: ProgrammeStatus.EN_PREPARATION,
    actif: true,
    date_debut: null,
    date_fin: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const programmeRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProgrammeRepository>;

  const uniteService = {
    findOne: jest.fn().mockResolvedValue({ id: UNI_ID }),
  } as unknown as jest.Mocked<UniteService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new ProgrammeService(
    programmeRepository,
    uniteService,
    auditService,
    eventEmitter,
  );

  return { service, programmeRepository, uniteService, auditService, eventEmitter };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('ProgrammeService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.programmeRepository.findManyPaginated.mockResolvedValue({
      programmes: [buildProgramme()],
      total: 1,
    });
  });

  it('returns a paginated result of ProgrammeResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new ProgrammeQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].uniteId).toBe(UNI_ID);
    expect(result.data[0].statut).toBe(ProgrammeStatus.EN_PREPARATION);
  });

  it('forwards uniteId, statut and actif filters to the repository', async () => {
    const query = Object.assign(new ProgrammeQueryDto(), {
      uniteId: UNI_ID,
      statut: ProgrammeStatus.EN_COURS,
      actif: false,
    });
    await mocks.service.findAll(query);

    expect(mocks.programmeRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        uniteId: UNI_ID,
        statut: ProgrammeStatus.EN_COURS,
        actif: false,
      }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new ProgrammeQueryDto(), {
      sortBy: 'unite_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.programmeRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field (statut)', async () => {
    const query = Object.assign(new ProgrammeQueryDto(), { sortBy: 'statut', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.programmeRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { statut: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('ProgrammeService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a ProgrammeResponseDto for an existing programme', async () => {
    mocks.programmeRepository.findById.mockResolvedValue(buildProgramme());

    const result = await mocks.service.findOne('prg-001');

    expect(result.id).toBe('prg-001');
    expect(result.uniteId).toBe(UNI_ID);
  });

  it('throws PROGRAMME_NOT_FOUND when the programme does not exist', async () => {
    mocks.programmeRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.PROGRAMME_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('ProgrammeService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { uniteId: UNI_ID, code: 'PRG-SANTE', nom: 'Programme Santé' };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.programmeRepository.findByCode.mockResolvedValue(null);
    mocks.programmeRepository.findByName.mockResolvedValue(null);
    mocks.programmeRepository.create.mockResolvedValue(buildProgramme());
  });

  it('verifies the parent unité exists before creating', async () => {
    await mocks.service.create(dto);

    expect(mocks.uniteService.findOne).toHaveBeenCalledWith(UNI_ID);
    expect(mocks.programmeRepository.create).toHaveBeenCalled();
  });

  it('propagates UNITE_NOT_FOUND (404) when the unité does not exist or is soft-deleted', async () => {
    mocks.uniteService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.UNITE_NOT_FOUND, 'Unité introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.UNITE_NOT_FOUND,
    });
    expect(mocks.programmeRepository.create).not.toHaveBeenCalled();
  });

  it('defaults the statut to EN_PREPARATION when omitted', async () => {
    await mocks.service.create(dto);

    expect(mocks.programmeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ statut: ProgrammeStatus.EN_PREPARATION }),
    );
  });

  it('forwards an explicit statut', async () => {
    await mocks.service.create({ ...dto, statut: ProgrammeStatus.EN_COURS });

    expect(mocks.programmeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ statut: ProgrammeStatus.EN_COURS }),
    );
  });

  it('throws PROGRAMME_CODE_TAKEN when the code already exists in the unité', async () => {
    mocks.programmeRepository.findByCode.mockResolvedValue(buildProgramme());

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROGRAMME_CODE_TAKEN,
    });
    expect(mocks.programmeRepository.create).not.toHaveBeenCalled();
  });

  it('throws PROGRAMME_NAME_TAKEN when the name already exists in the unité', async () => {
    mocks.programmeRepository.findByName.mockResolvedValue(buildProgramme({ code: 'OTHER' }));

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROGRAMME_NAME_TAKEN,
    });
    expect(mocks.programmeRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 on nom into PROGRAMME_NAME_TAKEN', async () => {
    mocks.programmeRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['unite_id', 'nom'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROGRAMME_NAME_TAKEN,
    });
  });

  it('translates a Prisma P2002 on code into PROGRAMME_CODE_TAKEN', async () => {
    mocks.programmeRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['unite_id', 'code'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROGRAMME_CODE_TAKEN,
    });
  });

  it('writes a CREATE audit log and emits PROGRAMME_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'programmes',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.PROGRAMME_CREATED,
      expect.objectContaining({ programmeId: 'prg-001', uniteId: UNI_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('ProgrammeService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.programmeRepository.findById.mockResolvedValue(buildProgramme());
    mocks.programmeRepository.findByName.mockResolvedValue(null);
    mocks.programmeRepository.update.mockResolvedValue(
      buildProgramme({ nom: 'Nouveau nom', statut: ProgrammeStatus.EN_COURS }),
    );
  });

  it('throws PROGRAMME_NOT_FOUND when the programme does not exist', async () => {
    mocks.programmeRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { nom: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('checks name uniqueness within the same unité and throws on collision', async () => {
    mocks.programmeRepository.findByName.mockResolvedValue(buildProgramme({ id: 'other' }));

    await expect(mocks.service.update('prg-001', { nom: 'Déjà pris' })).rejects.toMatchObject({
      errorCode: ErrorCode.PROGRAMME_NAME_TAKEN,
    });
    expect(mocks.programmeRepository.findByName).toHaveBeenCalledWith(UNI_ID, 'Déjà pris');
    expect(mocks.programmeRepository.update).not.toHaveBeenCalled();
  });

  it('allows updating the statut without a name check when the name is unchanged', async () => {
    await mocks.service.update('prg-001', { statut: ProgrammeStatus.EN_COURS });

    expect(mocks.programmeRepository.findByName).not.toHaveBeenCalled();
    expect(mocks.programmeRepository.update).toHaveBeenCalledWith(
      'prg-001',
      expect.objectContaining({ statut: ProgrammeStatus.EN_COURS }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits PROGRAMME_UPDATED', async () => {
    await mocks.service.update('prg-001', { nom: 'Nouveau nom' }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'programmes',
        enregistrementId: 'prg-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.PROGRAMME_UPDATED, {
      programmeId: 'prg-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('ProgrammeService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.programmeRepository.findById.mockResolvedValue(buildProgramme());
  });

  it('throws PROGRAMME_NOT_FOUND when the programme does not exist', async () => {
    mocks.programmeRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.programmeRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('prg-001');

    expect(mocks.programmeRepository.softDelete).toHaveBeenCalledWith('prg-001');
  });

  it('writes a DELETE audit log and emits PROGRAMME_DELETED', async () => {
    await mocks.service.remove('prg-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'programmes' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.PROGRAMME_DELETED, {
      programmeId: 'prg-001',
    });
  });
});
