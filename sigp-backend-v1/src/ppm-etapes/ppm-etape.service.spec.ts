import { AuditAction, PpmEtape, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PpmService } from '@/ppm/ppm.service';
import { PpmEtapeRepository } from './ppm-etape.repository';
import { PpmEtapeService } from './ppm-etape.service';
import { PpmEtapeQueryDto } from './dto/ppm-etape-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const MARCHE_ID = 'ppm-0001-0000-0000-000000000000';

function buildEtape(overrides: Partial<PpmEtape> = {}): PpmEtape {
  return {
    id: 'eta-0001-0000-0000-000000000000',
    marche_id: MARCHE_ID,
    libelle: 'Publication de la demande de propositions',
    ordre: 1,
    date_prevue: new Date('2026-03-01'),
    date_reelle: null,
    complete: false,
    notes: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function buildMocks() {
  const ppmEtapeRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByPpmMarche: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<PpmEtapeRepository>;

  const ppmService = {
    findOne: jest.fn().mockResolvedValue({ id: MARCHE_ID }),
  } as unknown as jest.Mocked<PpmService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new PpmEtapeService(ppmEtapeRepository, ppmService, auditService, eventEmitter);

  return { service, ppmEtapeRepository, ppmService, auditService, eventEmitter };
}

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('PpmEtapeService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ppmEtapeRepository.findManyPaginated.mockResolvedValue({
      etapes: [buildEtape()],
      total: 1,
    });
  });

  it('returns a paginated result without internal fields', async () => {
    const result = await mocks.service.findAll(new PpmEtapeQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0].marcheId).toBe(MARCHE_ID);
    expect(result.data[0].complete).toBe(false);
  });

  it('forwards all query filters to the repository', async () => {
    const query = Object.assign(new PpmEtapeQueryDto(), {
      marcheId: MARCHE_ID,
      complete: true,
    });
    await mocks.service.findAll(query);

    expect(mocks.ppmEtapeRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        marcheId: MARCHE_ID,
        complete: true,
      }),
    );
  });

  it('falls back to ordre when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new PpmEtapeQueryDto(), {
      sortBy: 'marche_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.ppmEtapeRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { ordre: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (libelle)', async () => {
    const query = Object.assign(new PpmEtapeQueryDto(), { sortBy: 'libelle', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.ppmEtapeRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { libelle: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (date_prevue)', async () => {
    const query = Object.assign(new PpmEtapeQueryDto(), {
      sortBy: 'date_prevue',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.ppmEtapeRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { date_prevue: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (complete)', async () => {
    const query = Object.assign(new PpmEtapeQueryDto(), { sortBy: 'complete', sortOrder: 'desc' });
    await mocks.service.findAll(query);

    expect(mocks.ppmEtapeRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { complete: 'desc' } }),
    );
  });
});

// ─── findOne ─────────────────────────────────────────────────────────────────

describe('PpmEtapeService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a PpmEtapeResponseDto for an existing étape', async () => {
    mocks.ppmEtapeRepository.findById.mockResolvedValue(buildEtape());

    const result = await mocks.service.findOne('eta-0001-0000-0000-000000000000');

    expect(result.id).toBe('eta-0001-0000-0000-000000000000');
    expect(result.ordre).toBe(1);
  });

  it('throws PPM_ETAPE_NOT_FOUND when it does not exist', async () => {
    mocks.ppmEtapeRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.PPM_ETAPE_NOT_FOUND,
    });
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('PpmEtapeService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ppmEtapeRepository.create.mockResolvedValue(buildEtape());
  });

  it('creates an étape after validating the marché', async () => {
    await mocks.service.create({
      marcheId: MARCHE_ID,
      libelle: 'Publication',
      ordre: 1,
    });

    expect(mocks.ppmService.findOne).toHaveBeenCalledWith(MARCHE_ID);
    expect(mocks.ppmEtapeRepository.create).toHaveBeenCalled();
  });

  it('throws 404 when marcheId does not exist', async () => {
    mocks.ppmService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PPM_MARCHE_NOT_FOUND, 'Marché introuvable'),
    );

    await expect(
      mocks.service.create({ marcheId: MARCHE_ID, libelle: 'Publication', ordre: 1 }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PPM_MARCHE_NOT_FOUND });
    expect(mocks.ppmEtapeRepository.create).not.toHaveBeenCalled();
  });

  it('converts date strings to Date objects', async () => {
    await mocks.service.create({
      marcheId: MARCHE_ID,
      libelle: 'Publication',
      ordre: 1,
      datePrevue: '2026-03-01',
      dateReelle: '2026-03-15',
    });

    expect(mocks.ppmEtapeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        datePrevue: new Date('2026-03-01'),
        dateReelle: new Date('2026-03-15'),
      }),
    );
  });

  it('defaults complete to false when not provided', async () => {
    await mocks.service.create({ marcheId: MARCHE_ID, libelle: 'Publication', ordre: 1 });

    expect(mocks.ppmEtapeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ complete: false }),
    );
  });

  it('translates a Prisma P2002 into a CONFLICT (409)', async () => {
    mocks.ppmEtapeRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(
      mocks.service.create({ marcheId: MARCHE_ID, libelle: 'Étape', ordre: 1 }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.CONFLICT });
  });

  it('writes a CREATE audit log and emits PPM_ETAPE_CREATED', async () => {
    await mocks.service.create(
      { marcheId: MARCHE_ID, libelle: 'Publication', ordre: 1 },
      { userId: 'admin-1', ip: '127.0.0.1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'ppm_etapes',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.PPM_ETAPE_CREATED,
      expect.objectContaining({ etapeId: 'eta-0001-0000-0000-000000000000' }),
    );
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('PpmEtapeService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ppmEtapeRepository.findById.mockResolvedValue(buildEtape());
    mocks.ppmEtapeRepository.update.mockResolvedValue(buildEtape({ complete: true }));
  });

  it('throws PPM_ETAPE_NOT_FOUND when it does not exist', async () => {
    mocks.ppmEtapeRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { complete: true })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('converts date strings to Date objects on update', async () => {
    await mocks.service.update('eta-0001-0000-0000-000000000000', { dateReelle: '2026-03-20' });

    expect(mocks.ppmEtapeRepository.update).toHaveBeenCalledWith(
      'eta-0001-0000-0000-000000000000',
      expect.objectContaining({ dateReelle: new Date('2026-03-20') }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits PPM_ETAPE_UPDATED', async () => {
    await mocks.service.update(
      'eta-0001-0000-0000-000000000000',
      { complete: true },
      { userId: 'admin-1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'ppm_etapes',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.PPM_ETAPE_UPDATED, {
      etapeId: 'eta-0001-0000-0000-000000000000',
    });
  });

  it('translates a P2002 on update into a CONFLICT', async () => {
    mocks.ppmEtapeRepository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(
      mocks.service.update('eta-0001-0000-0000-000000000000', { ordre: 2 }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.CONFLICT });
  });
});

// ─── remove (delete) ─────────────────────────────────────────────────────────

describe('PpmEtapeService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ppmEtapeRepository.findById.mockResolvedValue(buildEtape());
  });

  it('throws PPM_ETAPE_NOT_FOUND when it does not exist', async () => {
    mocks.ppmEtapeRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.ppmEtapeRepository.softDelete).not.toHaveBeenCalled();
  });

  it('deletes the étape via the repository', async () => {
    await mocks.service.remove('eta-0001-0000-0000-000000000000');

    expect(mocks.ppmEtapeRepository.softDelete).toHaveBeenCalledWith(
      'eta-0001-0000-0000-000000000000',
    );
  });

  it('writes a DELETE audit log and emits PPM_ETAPE_DELETED', async () => {
    await mocks.service.remove('eta-0001-0000-0000-000000000000', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'ppm_etapes' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.PPM_ETAPE_DELETED, {
      etapeId: 'eta-0001-0000-0000-000000000000',
    });
  });
});
