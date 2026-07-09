import { AuditAction, JournalOperation, JournalType, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BudgetLineService } from '@/budget-lines/budget-line.service';
import { JournalOperationRepository } from './journal-operation.repository';
import { JournalOperationService } from './journal-operation.service';
import { JournalOperationQueryDto } from './dto/journal-operation-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const LINE_ID = 'bl-001';

function buildOperation(overrides: Partial<JournalOperation> = {}): JournalOperation {
  return {
    id: 'op-001',
    budget_ligne_id: LINE_ID,
    type: JournalType.DEPENSE,
    montant: 5000000 as unknown as Prisma.Decimal,
    date_operation: new Date('2026-03-15'),
    reference: 'BON-2026-001',
    description: 'Paiement salaires',
    piece_jointe_id: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const journalOperationRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByBudgetLine: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<JournalOperationRepository>;

  const budgetLineService = {
    findOne: jest.fn().mockResolvedValue({ id: LINE_ID }),
  } as unknown as jest.Mocked<BudgetLineService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new JournalOperationService(
    journalOperationRepository,
    budgetLineService,
    auditService,
    eventEmitter,
  );

  return {
    service,
    journalOperationRepository,
    budgetLineService,
    auditService,
    eventEmitter,
  };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('JournalOperationService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.journalOperationRepository.findManyPaginated.mockResolvedValue({
      operations: [buildOperation()],
      total: 1,
    });
  });

  it('returns a paginated result of JournalOperationResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new JournalOperationQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].budgetLineId).toBe(LINE_ID);
  });

  it('maps Decimal montant to a number in the response', async () => {
    mocks.journalOperationRepository.findManyPaginated.mockResolvedValue({
      operations: [buildOperation({ montant: 7500000 as unknown as Prisma.Decimal })],
      total: 1,
    });

    const result = await mocks.service.findAll(new JournalOperationQueryDto());
    expect(result.data[0].montant).toBe(7500000);
  });

  it('forwards budgetLineId and type filters', async () => {
    const query = Object.assign(new JournalOperationQueryDto(), {
      budgetLineId: LINE_ID,
      type: JournalType.DEPENSE,
    });
    await mocks.service.findAll(query);

    expect(mocks.journalOperationRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ budgetLineId: LINE_ID, type: JournalType.DEPENSE }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new JournalOperationQueryDto(), {
      sortBy: 'budget_ligne_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.journalOperationRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field (date_operation)', async () => {
    const query = Object.assign(new JournalOperationQueryDto(), {
      sortBy: 'date_operation',
      sortOrder: 'desc',
    });
    await mocks.service.findAll(query);

    expect(mocks.journalOperationRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { date_operation: 'desc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('JournalOperationService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a JournalOperationResponseDto for an existing operation', async () => {
    mocks.journalOperationRepository.findById.mockResolvedValue(buildOperation());

    const result = await mocks.service.findOne('op-001');

    expect(result.id).toBe('op-001');
    expect(result.type).toBe(JournalType.DEPENSE);
  });

  it('throws JOURNAL_OPERATION_NOT_FOUND when the operation does not exist', async () => {
    mocks.journalOperationRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.JOURNAL_OPERATION_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('JournalOperationService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = {
    budgetLineId: LINE_ID,
    type: JournalType.DEPENSE,
    montant: 5000000,
    dateOperation: '2026-03-15',
  };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.journalOperationRepository.create.mockResolvedValue(buildOperation());
  });

  it('verifies the budget line and creates the operation', async () => {
    await mocks.service.create(dto);

    expect(mocks.budgetLineService.findOne).toHaveBeenCalledWith(LINE_ID);
    expect(mocks.journalOperationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        budgetLineId: LINE_ID,
        type: JournalType.DEPENSE,
        montant: 5000000,
        dateOperation: new Date('2026-03-15'),
      }),
    );
  });

  it('propagates BUDGET_LIGNE_NOT_FOUND (404) when the budget line does not exist', async () => {
    mocks.budgetLineService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.BUDGET_LIGNE_NOT_FOUND, 'Ligne introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.BUDGET_LIGNE_NOT_FOUND,
    });
    expect(mocks.journalOperationRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 into a CONFLICT (409)', async () => {
    mocks.journalOperationRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });

  it('writes a CREATE audit log and emits JOURNAL_OPERATION_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'journal_operations',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.JOURNAL_OPERATION_CREATED,
      expect.objectContaining({ journalOperationId: 'op-001', budgetLineId: LINE_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('JournalOperationService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.journalOperationRepository.findById.mockResolvedValue(buildOperation());
    mocks.journalOperationRepository.update.mockResolvedValue(
      buildOperation({ type: JournalType.RECETTE }),
    );
  });

  it('throws JOURNAL_OPERATION_NOT_FOUND when the operation does not exist', async () => {
    mocks.journalOperationRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.service.update('missing', { type: JournalType.RECETTE }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('converts dateOperation ISO string to a Date on update', async () => {
    await mocks.service.update('op-001', { dateOperation: '2026-04-01' });

    expect(mocks.journalOperationRepository.update).toHaveBeenCalledWith(
      'op-001',
      expect.objectContaining({ dateOperation: new Date('2026-04-01') }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits JOURNAL_OPERATION_UPDATED', async () => {
    await mocks.service.update('op-001', { type: JournalType.RECETTE }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'journal_operations',
        enregistrementId: 'op-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.JOURNAL_OPERATION_UPDATED, {
      journalOperationId: 'op-001',
    });
  });

  it('translates a P2002 on update into a CONFLICT', async () => {
    mocks.journalOperationRepository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.update('op-001', { montant: 9000000 })).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });
});

// ─── remove (soft delete) ────────────────────────────────────────────────────

describe('JournalOperationService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.journalOperationRepository.findById.mockResolvedValue(buildOperation());
  });

  it('throws JOURNAL_OPERATION_NOT_FOUND when the operation does not exist', async () => {
    mocks.journalOperationRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.journalOperationRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('op-001');

    expect(mocks.journalOperationRepository.softDelete).toHaveBeenCalledWith('op-001');
  });

  it('writes a DELETE audit log and emits JOURNAL_OPERATION_DELETED', async () => {
    await mocks.service.remove('op-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'journal_operations' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.JOURNAL_OPERATION_DELETED, {
      journalOperationId: 'op-001',
    });
  });
});
