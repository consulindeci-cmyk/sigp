import { AuditAction, Disbursement, DisbursementStatus, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BudgetVersionService } from '@/budget-versions/budget-version.service';
import { BudgetLineService } from '@/budget-lines/budget-line.service';
import { FundingSourceService } from '@/funding-sources/funding-source.service';
import { DisbursementRepository } from './disbursement.repository';
import { DisbursementService } from './disbursement.service';
import { DisbursementQueryDto } from './dto/disbursement-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const VERSION_ID = 'ver-0001-0000-0000-000000000000';
const LINE_ID = 'lin-0001-0000-0000-000000000000';
const SOURCE_ID = 'src-0001-0000-0000-000000000000';
const PROJECT_ID = 'proj-0001-0000-0000-000000000000';

function buildDisbursement(overrides: Partial<Disbursement> = {}): Disbursement {
  return {
    id: 'dis-0001-0000-0000-000000000000',
    budget_version_id: VERSION_ID,
    budget_ligne_id: LINE_ID,
    contract_id: null,
    funding_source_id: SOURCE_ID,
    statut: DisbursementStatus.PLANIFIE,
    montant: 5000000 as unknown as Prisma.Decimal,
    date_prevue: new Date('2026-06-01'),
    date_reelle: null,
    reference: 'DEC-2026-001',
    description: 'Premier décaissement',
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const disbursementRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByBudgetVersion: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<DisbursementRepository>;

  const budgetVersionService = {
    findOne: jest.fn().mockResolvedValue({ id: VERSION_ID, projectId: PROJECT_ID }),
  } as unknown as jest.Mocked<BudgetVersionService>;

  const budgetLineService = {
    findOne: jest.fn().mockResolvedValue({ id: LINE_ID, versionId: VERSION_ID }),
  } as unknown as jest.Mocked<BudgetLineService>;

  const fundingSourceService = {
    findOne: jest.fn().mockResolvedValue({ id: SOURCE_ID, projectId: PROJECT_ID }),
  } as unknown as jest.Mocked<FundingSourceService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new DisbursementService(
    disbursementRepository,
    budgetVersionService,
    budgetLineService,
    fundingSourceService,
    auditService,
    eventEmitter,
  );

  return {
    service,
    disbursementRepository,
    budgetVersionService,
    budgetLineService,
    fundingSourceService,
    auditService,
    eventEmitter,
  };
}

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('DisbursementService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.disbursementRepository.findManyPaginated.mockResolvedValue({
      disbursements: [buildDisbursement()],
      total: 1,
    });
  });

  it('returns a paginated result without internal fields', async () => {
    const result = await mocks.service.findAll(new DisbursementQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].budgetVersionId).toBe(VERSION_ID);
  });

  it('maps Decimal montant to a number', async () => {
    mocks.disbursementRepository.findManyPaginated.mockResolvedValue({
      disbursements: [buildDisbursement({ montant: 9999999 as unknown as Prisma.Decimal })],
      total: 1,
    });

    const result = await mocks.service.findAll(new DisbursementQueryDto());
    expect(result.data[0].montant).toBe(9999999);
  });

  it('forwards all query filters to the repository', async () => {
    const query = Object.assign(new DisbursementQueryDto(), {
      budgetVersionId: VERSION_ID,
      budgetLineId: LINE_ID,
      fundingSourceId: SOURCE_ID,
      statut: DisbursementStatus.APPROUVE,
    });
    await mocks.service.findAll(query);

    expect(mocks.disbursementRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        budgetVersionId: VERSION_ID,
        budgetLineId: LINE_ID,
        fundingSourceId: SOURCE_ID,
        statut: DisbursementStatus.APPROUVE,
      }),
    );
  });

  it('falls back to created_at when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new DisbursementQueryDto(), {
      sortBy: 'budget_version_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.disbursementRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (montant)', async () => {
    const query = Object.assign(new DisbursementQueryDto(), {
      sortBy: 'montant',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.disbursementRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { montant: 'asc' } }),
    );
  });
});

// ─── findOne ─────────────────────────────────────────────────────────────────

describe('DisbursementService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a DisbursementResponseDto for an existing disbursement', async () => {
    mocks.disbursementRepository.findById.mockResolvedValue(buildDisbursement());

    const result = await mocks.service.findOne('dis-0001-0000-0000-000000000000');

    expect(result.id).toBe('dis-0001-0000-0000-000000000000');
    expect(result.statut).toBe(DisbursementStatus.PLANIFIE);
  });

  it('throws DISBURSEMENT_NOT_FOUND when it does not exist', async () => {
    mocks.disbursementRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.DISBURSEMENT_NOT_FOUND,
    });
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('DisbursementService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.disbursementRepository.create.mockResolvedValue(buildDisbursement());
  });

  it('creates a disbursement after validating relations', async () => {
    await mocks.service.create({
      budgetVersionId: VERSION_ID,
      budgetLineId: LINE_ID,
      fundingSourceId: SOURCE_ID,
      montant: 5000000,
    });

    expect(mocks.budgetVersionService.findOne).toHaveBeenCalledWith(VERSION_ID);
    expect(mocks.budgetLineService.findOne).toHaveBeenCalledWith(LINE_ID);
    expect(mocks.fundingSourceService.findOne).toHaveBeenCalledWith(SOURCE_ID);
    expect(mocks.disbursementRepository.create).toHaveBeenCalled();
  });

  it('works with only montant (all FK are optional)', async () => {
    await mocks.service.create({ montant: 1000 });

    expect(mocks.budgetVersionService.findOne).not.toHaveBeenCalled();
    expect(mocks.budgetLineService.findOne).not.toHaveBeenCalled();
    expect(mocks.fundingSourceService.findOne).not.toHaveBeenCalled();
    expect(mocks.disbursementRepository.create).toHaveBeenCalled();
  });

  it('throws 404 when budgetVersionId does not exist', async () => {
    mocks.budgetVersionService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.BUDGET_VERSION_NOT_FOUND, 'Version introuvable'),
    );

    await expect(
      mocks.service.create({ budgetVersionId: VERSION_ID, montant: 1000 }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.BUDGET_VERSION_NOT_FOUND });
    expect(mocks.disbursementRepository.create).not.toHaveBeenCalled();
  });

  it('throws 404 when budgetLineId does not exist', async () => {
    mocks.budgetLineService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.BUDGET_LIGNE_NOT_FOUND, 'Ligne introuvable'),
    );

    await expect(
      mocks.service.create({ budgetLineId: LINE_ID, montant: 1000 }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.BUDGET_LIGNE_NOT_FOUND });
    expect(mocks.disbursementRepository.create).not.toHaveBeenCalled();
  });

  it('throws 404 when fundingSourceId does not exist', async () => {
    mocks.fundingSourceService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.FUNDING_SOURCE_NOT_FOUND, 'Source introuvable'),
    );

    await expect(
      mocks.service.create({ fundingSourceId: SOURCE_ID, montant: 1000 }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.FUNDING_SOURCE_NOT_FOUND });
    expect(mocks.disbursementRepository.create).not.toHaveBeenCalled();
  });

  it('throws DISBURSEMENT_COHERENCE_VIOLATION when budgetLine.versionId does not match budgetVersionId', async () => {
    mocks.budgetLineService.findOne.mockResolvedValue({
      id: LINE_ID,
      versionId: 'other-version-id',
    } as never);

    await expect(
      mocks.service.create({ budgetVersionId: VERSION_ID, budgetLineId: LINE_ID, montant: 1000 }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.DISBURSEMENT_COHERENCE_VIOLATION });
    expect(mocks.disbursementRepository.create).not.toHaveBeenCalled();
  });

  it('throws DISBURSEMENT_COHERENCE_VIOLATION when fundingSource belongs to a different project', async () => {
    mocks.fundingSourceService.findOne.mockResolvedValue({
      id: SOURCE_ID,
      projectId: 'other-project-id',
    } as never);

    await expect(
      mocks.service.create({
        budgetVersionId: VERSION_ID,
        fundingSourceId: SOURCE_ID,
        montant: 1000,
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.DISBURSEMENT_COHERENCE_VIOLATION });
    expect(mocks.disbursementRepository.create).not.toHaveBeenCalled();
  });

  it('converts date strings to Date objects', async () => {
    await mocks.service.create({
      montant: 1000,
      datePrevue: '2026-06-01',
      dateReelle: '2026-06-15',
    });

    expect(mocks.disbursementRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        datePrevue: new Date('2026-06-01'),
        dateReelle: new Date('2026-06-15'),
      }),
    );
  });

  it('translates a Prisma P2002 into a CONFLICT (409)', async () => {
    mocks.disbursementRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.create({ montant: 1000 })).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });

  it('writes a CREATE audit log and emits DISBURSEMENT_CREATED', async () => {
    await mocks.service.create({ montant: 5000000 }, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'disbursements',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.DISBURSEMENT_CREATED,
      expect.objectContaining({ disbursementId: 'dis-0001-0000-0000-000000000000' }),
    );
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('DisbursementService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.disbursementRepository.findById.mockResolvedValue(buildDisbursement());
    mocks.disbursementRepository.update.mockResolvedValue(
      buildDisbursement({ statut: DisbursementStatus.APPROUVE }),
    );
  });

  it('throws DISBURSEMENT_NOT_FOUND when it does not exist', async () => {
    mocks.disbursementRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.service.update('missing', { statut: DisbursementStatus.APPROUVE }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('converts date strings to Date objects on update', async () => {
    await mocks.service.update('dis-0001-0000-0000-000000000000', { datePrevue: '2026-07-01' });

    expect(mocks.disbursementRepository.update).toHaveBeenCalledWith(
      'dis-0001-0000-0000-000000000000',
      expect.objectContaining({ datePrevue: new Date('2026-07-01') }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits DISBURSEMENT_UPDATED', async () => {
    await mocks.service.update(
      'dis-0001-0000-0000-000000000000',
      { statut: DisbursementStatus.APPROUVE },
      { userId: 'admin-1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'disbursements',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.DISBURSEMENT_UPDATED, {
      disbursementId: 'dis-0001-0000-0000-000000000000',
    });
  });

  it('translates a P2002 on update into a CONFLICT', async () => {
    mocks.disbursementRepository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(
      mocks.service.update('dis-0001-0000-0000-000000000000', { montant: 9999999 }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.CONFLICT });
  });
});

// ─── remove (soft delete) ────────────────────────────────────────────────────

describe('DisbursementService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.disbursementRepository.findById.mockResolvedValue(buildDisbursement());
  });

  it('throws DISBURSEMENT_NOT_FOUND when it does not exist', async () => {
    mocks.disbursementRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.disbursementRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('dis-0001-0000-0000-000000000000');

    expect(mocks.disbursementRepository.softDelete).toHaveBeenCalledWith(
      'dis-0001-0000-0000-000000000000',
    );
  });

  it('writes a DELETE audit log and emits DISBURSEMENT_DELETED', async () => {
    await mocks.service.remove('dis-0001-0000-0000-000000000000', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'disbursements' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.DISBURSEMENT_DELETED, {
      disbursementId: 'dis-0001-0000-0000-000000000000',
    });
  });
});
