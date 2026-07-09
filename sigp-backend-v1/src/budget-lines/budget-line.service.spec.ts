import { AuditAction, BudgetLigne, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BudgetVersionService } from '@/budget-versions/budget-version.service';
import { BudgetLineRepository } from './budget-line.repository';
import { BudgetLineService } from './budget-line.service';
import { BudgetLineQueryDto } from './dto/budget-line-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const VERSION_ID = 'bv-001';

function buildLigne(overrides: Partial<BudgetLigne> = {}): BudgetLigne {
  return {
    id: 'bl-001',
    version_id: VERSION_ID,
    parent_id: null,
    code_ligne: 'PERS-001',
    libelle: 'Personnel permanent',
    categorie: 'RH',
    montant_prevu: 50000000 as unknown as Prisma.Decimal,
    montant_engage: 10000000 as unknown as Prisma.Decimal,
    montant_paye: 5000000 as unknown as Prisma.Decimal,
    ordre: 1,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const budgetLineRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByBudgetVersion: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<BudgetLineRepository>;

  const budgetVersionService = {
    findOne: jest.fn().mockResolvedValue({ id: VERSION_ID }),
  } as unknown as jest.Mocked<BudgetVersionService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new BudgetLineService(
    budgetLineRepository,
    budgetVersionService,
    auditService,
    eventEmitter,
  );

  return { service, budgetLineRepository, budgetVersionService, auditService, eventEmitter };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('BudgetLineService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.budgetLineRepository.findManyPaginated.mockResolvedValue({
      lignes: [buildLigne()],
      total: 1,
    });
  });

  it('returns a paginated result of BudgetLineResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new BudgetLineQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].versionId).toBe(VERSION_ID);
  });

  it('maps all Decimal montant fields to numbers in the response', async () => {
    mocks.budgetLineRepository.findManyPaginated.mockResolvedValue({
      lignes: [
        buildLigne({
          montant_prevu: 50000000 as unknown as Prisma.Decimal,
          montant_engage: 10000000 as unknown as Prisma.Decimal,
          montant_paye: 5000000 as unknown as Prisma.Decimal,
        }),
      ],
      total: 1,
    });

    const result = await mocks.service.findAll(new BudgetLineQueryDto());
    expect(result.data[0].montantPrevu).toBe(50000000);
    expect(result.data[0].montantEngage).toBe(10000000);
    expect(result.data[0].montantPaye).toBe(5000000);
  });

  it('forwards versionId and parentId filters', async () => {
    const query = Object.assign(new BudgetLineQueryDto(), {
      versionId: VERSION_ID,
      parentId: 'parent-1',
    });
    await mocks.service.findAll(query);

    expect(mocks.budgetLineRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ versionId: VERSION_ID, parentId: 'parent-1' }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new BudgetLineQueryDto(), {
      sortBy: 'version_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.budgetLineRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field (ordre)', async () => {
    const query = Object.assign(new BudgetLineQueryDto(), { sortBy: 'ordre', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.budgetLineRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { ordre: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('BudgetLineService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a BudgetLineResponseDto for an existing ligne', async () => {
    mocks.budgetLineRepository.findById.mockResolvedValue(buildLigne());

    const result = await mocks.service.findOne('bl-001');

    expect(result.id).toBe('bl-001');
    expect(result.codeLigne).toBe('PERS-001');
  });

  it('throws BUDGET_LIGNE_NOT_FOUND when the ligne does not exist', async () => {
    mocks.budgetLineRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.BUDGET_LIGNE_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('BudgetLineService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { versionId: VERSION_ID, codeLigne: 'PERS-001', libelle: 'Personnel permanent' };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.budgetLineRepository.create.mockResolvedValue(buildLigne());
  });

  it('verifies the budget version and creates the ligne', async () => {
    await mocks.service.create(dto);

    expect(mocks.budgetVersionService.findOne).toHaveBeenCalledWith(VERSION_ID);
    expect(mocks.budgetLineRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ versionId: VERSION_ID, codeLigne: 'PERS-001' }),
    );
  });

  it('propagates BUDGET_VERSION_NOT_FOUND (404) when the version does not exist', async () => {
    mocks.budgetVersionService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.BUDGET_VERSION_NOT_FOUND, 'Version introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.BUDGET_VERSION_NOT_FOUND,
    });
    expect(mocks.budgetLineRepository.create).not.toHaveBeenCalled();
  });

  it('throws BUDGET_LIGNE_NOT_FOUND (404) when the parent ligne does not exist', async () => {
    mocks.budgetLineRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.create({ ...dto, parentId: 'ghost-parent' })).rejects.toMatchObject({
      errorCode: ErrorCode.BUDGET_LIGNE_NOT_FOUND,
    });
    expect(mocks.budgetLineRepository.create).not.toHaveBeenCalled();
  });

  it('throws BUDGET_COHERENCE_VIOLATION (409) when the parent belongs to another version', async () => {
    mocks.budgetLineRepository.findById.mockResolvedValue(
      buildLigne({ version_id: 'other-version' }),
    );

    await expect(mocks.service.create({ ...dto, parentId: 'bl-parent' })).rejects.toMatchObject({
      errorCode: ErrorCode.BUDGET_COHERENCE_VIOLATION,
    });
    expect(mocks.budgetLineRepository.create).not.toHaveBeenCalled();
  });

  it('skips parent validation when no parentId is provided', async () => {
    await mocks.service.create(dto);

    expect(mocks.budgetLineRepository.findById).not.toHaveBeenCalled();
    expect(mocks.budgetLineRepository.create).toHaveBeenCalled();
  });

  it('translates a Prisma P2002 (code_ligne duplicate) into a CONFLICT (409)', async () => {
    mocks.budgetLineRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });

  it('writes a CREATE audit log and emits BUDGET_LINE_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'budget_lignes',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.BUDGET_LINE_CREATED,
      expect.objectContaining({ budgetLineId: 'bl-001', versionId: VERSION_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('BudgetLineService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.budgetLineRepository.findById.mockResolvedValue(buildLigne());
    mocks.budgetLineRepository.update.mockResolvedValue(
      buildLigne({ montant_engage: 12000000 as unknown as Prisma.Decimal }),
    );
  });

  it('throws BUDGET_LIGNE_NOT_FOUND when the ligne does not exist', async () => {
    mocks.budgetLineRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.service.update('missing', { libelle: 'Nouveau libellé' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('validates a re-linked parent against the ligne version (409 if cross-version)', async () => {
    mocks.budgetLineRepository.findById
      .mockResolvedValueOnce(buildLigne())
      .mockResolvedValueOnce(buildLigne({ id: 'parent-x', version_id: 'other-version' }));

    await expect(mocks.service.update('bl-001', { parentId: 'parent-x' })).rejects.toMatchObject({
      errorCode: ErrorCode.BUDGET_COHERENCE_VIOLATION,
    });
    expect(mocks.budgetLineRepository.update).not.toHaveBeenCalled();
  });

  it('writes an UPDATE audit log with avant/apres and emits BUDGET_LINE_UPDATED', async () => {
    await mocks.service.update('bl-001', { montantEngage: 12000000 }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'budget_lignes',
        enregistrementId: 'bl-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.BUDGET_LINE_UPDATED, {
      budgetLineId: 'bl-001',
    });
  });

  it('translates a P2002 on update into a CONFLICT', async () => {
    mocks.budgetLineRepository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.update('bl-001', { libelle: 'X' })).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });
});

// ─── remove (soft delete) ────────────────────────────────────────────────────

describe('BudgetLineService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.budgetLineRepository.findById.mockResolvedValue(buildLigne());
  });

  it('throws BUDGET_LIGNE_NOT_FOUND when the ligne does not exist', async () => {
    mocks.budgetLineRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.budgetLineRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('bl-001');

    expect(mocks.budgetLineRepository.softDelete).toHaveBeenCalledWith('bl-001');
  });

  it('writes a DELETE audit log and emits BUDGET_LINE_DELETED', async () => {
    await mocks.service.remove('bl-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'budget_lignes' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.BUDGET_LINE_DELETED, {
      budgetLineId: 'bl-001',
    });
  });
});
