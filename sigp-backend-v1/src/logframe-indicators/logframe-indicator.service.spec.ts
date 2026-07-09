import { AuditAction, IndicatorType, LogframeIndicator, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogframeObjectiveService } from '@/logframe-objectives/logframe-objective.service';
import { LogframeIndicatorRepository } from './logframe-indicator.repository';
import { LogframeIndicatorService } from './logframe-indicator.service';
import { LogframeIndicatorQueryDto } from './dto/logframe-indicator-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const OBJ_ID = 'obj-001';

function buildIndicator(overrides: Partial<LogframeIndicator> = {}): LogframeIndicator {
  return {
    id: 'ind-001',
    objective_id: OBJ_ID,
    code: 'IND-1',
    libelle: 'Taux de couverture vaccinale',
    type: IndicatorType.OUTPUT,
    unite: null,
    valeur_baseline: null,
    valeur_cible: null,
    valeur_actuelle: null,
    source_verification: null,
    periodicite: null,
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
  const logframeIndicatorRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByObjective: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<LogframeIndicatorRepository>;

  const logframeObjectiveService = {
    findOne: jest.fn().mockResolvedValue({ id: OBJ_ID }),
  } as unknown as jest.Mocked<LogframeObjectiveService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new LogframeIndicatorService(
    logframeIndicatorRepository,
    logframeObjectiveService,
    auditService,
    eventEmitter,
  );

  return {
    service,
    logframeIndicatorRepository,
    logframeObjectiveService,
    auditService,
    eventEmitter,
  };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('LogframeIndicatorService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.logframeIndicatorRepository.findManyPaginated.mockResolvedValue({
      indicators: [buildIndicator()],
      total: 1,
    });
  });

  it('returns a paginated result of LogframeIndicatorResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new LogframeIndicatorQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].objectiveId).toBe(OBJ_ID);
  });

  it('maps the Decimal values to numbers in the response', async () => {
    mocks.logframeIndicatorRepository.findManyPaginated.mockResolvedValue({
      indicators: [
        buildIndicator({
          valeur_baseline: 45.5 as unknown as Prisma.Decimal,
          valeur_cible: 90 as unknown as Prisma.Decimal,
        }),
      ],
      total: 1,
    });

    const result = await mocks.service.findAll(new LogframeIndicatorQueryDto());
    expect(result.data[0].valeurBaseline).toBe(45.5);
    expect(result.data[0].valeurCible).toBe(90);
  });

  it('forwards objectiveId, type and actif filters', async () => {
    const query = Object.assign(new LogframeIndicatorQueryDto(), {
      objectiveId: OBJ_ID,
      type: IndicatorType.OUTCOME,
      actif: false,
    });
    await mocks.service.findAll(query);

    expect(mocks.logframeIndicatorRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ objectiveId: OBJ_ID, type: IndicatorType.OUTCOME, actif: false }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new LogframeIndicatorQueryDto(), {
      sortBy: 'objective_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.logframeIndicatorRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field', async () => {
    const query = Object.assign(new LogframeIndicatorQueryDto(), {
      sortBy: 'code',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.logframeIndicatorRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { code: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('LogframeIndicatorService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a LogframeIndicatorResponseDto for an existing indicator', async () => {
    mocks.logframeIndicatorRepository.findById.mockResolvedValue(buildIndicator());

    const result = await mocks.service.findOne('ind-001');

    expect(result.id).toBe('ind-001');
    expect(result.code).toBe('IND-1');
  });

  it('throws LOGFRAME_INDICATOR_NOT_FOUND when the indicator does not exist', async () => {
    mocks.logframeIndicatorRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.LOGFRAME_INDICATOR_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('LogframeIndicatorService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { objectiveId: OBJ_ID, code: 'IND-1', libelle: 'Taux de couverture' };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.logframeIndicatorRepository.create.mockResolvedValue(buildIndicator());
  });

  it('verifies the parent objective exists before creating', async () => {
    await mocks.service.create(dto);

    expect(mocks.logframeObjectiveService.findOne).toHaveBeenCalledWith(OBJ_ID);
    expect(mocks.logframeIndicatorRepository.create).toHaveBeenCalled();
  });

  it('propagates LOGFRAME_OBJECTIVE_NOT_FOUND (404) when the objective does not exist', async () => {
    mocks.logframeObjectiveService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.LOGFRAME_OBJECTIVE_NOT_FOUND, 'Objectif introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.LOGFRAME_OBJECTIVE_NOT_FOUND,
    });
    expect(mocks.logframeIndicatorRepository.create).not.toHaveBeenCalled();
  });

  it('defaults the type to OUTPUT when omitted', async () => {
    await mocks.service.create(dto);

    expect(mocks.logframeIndicatorRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: IndicatorType.OUTPUT }),
    );
  });

  it('translates a Prisma P2002 into a CONFLICT', async () => {
    mocks.logframeIndicatorRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });

  it('writes a CREATE audit log and emits LOGFRAME_INDICATOR_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'logframe_indicators',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.LOGFRAME_INDICATOR_CREATED,
      expect.objectContaining({ indicatorId: 'ind-001', objectiveId: OBJ_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('LogframeIndicatorService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.logframeIndicatorRepository.findById.mockResolvedValue(buildIndicator());
    mocks.logframeIndicatorRepository.update.mockResolvedValue(
      buildIndicator({ valeur_actuelle: 62.3 as unknown as Prisma.Decimal }),
    );
  });

  it('throws LOGFRAME_INDICATOR_NOT_FOUND when the indicator does not exist', async () => {
    mocks.logframeIndicatorRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { valeurActuelle: 1 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('forwards the mutable fields to the repository', async () => {
    await mocks.service.update('ind-001', { valeurActuelle: 62.3, actif: false });

    expect(mocks.logframeIndicatorRepository.update).toHaveBeenCalledWith(
      'ind-001',
      expect.objectContaining({ valeurActuelle: 62.3, actif: false }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits LOGFRAME_INDICATOR_UPDATED', async () => {
    await mocks.service.update('ind-001', { valeurActuelle: 62.3 }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'logframe_indicators',
        enregistrementId: 'ind-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.LOGFRAME_INDICATOR_UPDATED, {
      indicatorId: 'ind-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('LogframeIndicatorService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.logframeIndicatorRepository.findById.mockResolvedValue(buildIndicator());
  });

  it('throws LOGFRAME_INDICATOR_NOT_FOUND when the indicator does not exist', async () => {
    mocks.logframeIndicatorRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.logframeIndicatorRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('ind-001');

    expect(mocks.logframeIndicatorRepository.softDelete).toHaveBeenCalledWith('ind-001');
  });

  it('writes a DELETE audit log and emits LOGFRAME_INDICATOR_DELETED', async () => {
    await mocks.service.remove('ind-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'logframe_indicators' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.LOGFRAME_INDICATOR_DELETED, {
      indicatorId: 'ind-001',
    });
  });
});
