import { AuditAction, BudgetStatus, BudgetVersion, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { BudgetVersionRepository } from './budget-version.repository';
import { BudgetVersionService } from './budget-version.service';
import { BudgetVersionQueryDto } from './dto/budget-version-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PROJ_ID = 'proj-001';

function buildVersion(overrides: Partial<BudgetVersion> = {}): BudgetVersion {
  return {
    id: 'bv-001',
    project_id: PROJ_ID,
    version: 1,
    nom: 'Budget initial 2026',
    statut: BudgetStatus.BROUILLON,
    montant_total: 150000000 as unknown as Prisma.Decimal,
    approuve_par: null,
    approuve_le: null,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const budgetVersionRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<BudgetVersionRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJ_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new BudgetVersionService(
    budgetVersionRepository,
    projectService,
    auditService,
    eventEmitter,
  );

  return { service, budgetVersionRepository, projectService, auditService, eventEmitter };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('BudgetVersionService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.budgetVersionRepository.findManyPaginated.mockResolvedValue({
      versions: [buildVersion()],
      total: 1,
    });
  });

  it('returns a paginated result of BudgetVersionResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new BudgetVersionQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].projectId).toBe(PROJ_ID);
  });

  it('maps Decimal montantTotal to a number in the response', async () => {
    mocks.budgetVersionRepository.findManyPaginated.mockResolvedValue({
      versions: [buildVersion({ montant_total: 99999999 as unknown as Prisma.Decimal })],
      total: 1,
    });

    const result = await mocks.service.findAll(new BudgetVersionQueryDto());
    expect(result.data[0].montantTotal).toBe(99999999);
  });

  it('forwards projectId, statut and version filters', async () => {
    const query = Object.assign(new BudgetVersionQueryDto(), {
      projectId: PROJ_ID,
      statut: BudgetStatus.APPROUVE,
      version: 2,
    });
    await mocks.service.findAll(query);

    expect(mocks.budgetVersionRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: PROJ_ID, statut: BudgetStatus.APPROUVE, version: 2 }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new BudgetVersionQueryDto(), {
      sortBy: 'project_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.budgetVersionRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field (version)', async () => {
    const query = Object.assign(new BudgetVersionQueryDto(), {
      sortBy: 'version',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.budgetVersionRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { version: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('BudgetVersionService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a BudgetVersionResponseDto for an existing version', async () => {
    mocks.budgetVersionRepository.findById.mockResolvedValue(buildVersion());

    const result = await mocks.service.findOne('bv-001');

    expect(result.id).toBe('bv-001');
    expect(result.nom).toBe('Budget initial 2026');
  });

  it('throws BUDGET_VERSION_NOT_FOUND when the version does not exist', async () => {
    mocks.budgetVersionRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.BUDGET_VERSION_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('BudgetVersionService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { projectId: PROJ_ID, nom: 'Budget initial 2026' };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.budgetVersionRepository.create.mockResolvedValue(buildVersion());
  });

  it('verifies the project and creates with default statut BROUILLON', async () => {
    await mocks.service.create(dto);

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJ_ID);
    expect(mocks.budgetVersionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ statut: BudgetStatus.BROUILLON }),
    );
  });

  it('propagates PROJECT_NOT_FOUND (404) when the project does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_NOT_FOUND,
    });
    expect(mocks.budgetVersionRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 (version duplicate) into a CONFLICT (409)', async () => {
    mocks.budgetVersionRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });

  it('writes a CREATE audit log and emits BUDGET_VERSION_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'budget_versions',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.BUDGET_VERSION_CREATED,
      expect.objectContaining({ budgetVersionId: 'bv-001', projectId: PROJ_ID }),
    );
  });

  it('converts approuveLe ISO string to a Date on creation', async () => {
    await mocks.service.create({ ...dto, approuveLe: '2026-03-15' });

    expect(mocks.budgetVersionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ approuveLe: new Date('2026-03-15') }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('BudgetVersionService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.budgetVersionRepository.findById.mockResolvedValue(buildVersion());
    mocks.budgetVersionRepository.update.mockResolvedValue(
      buildVersion({ statut: BudgetStatus.SOUMIS }),
    );
  });

  it('throws BUDGET_VERSION_NOT_FOUND when the version does not exist', async () => {
    mocks.budgetVersionRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.service.update('missing', { statut: BudgetStatus.SOUMIS }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('writes an UPDATE audit log with avant/apres and emits BUDGET_VERSION_UPDATED', async () => {
    await mocks.service.update('bv-001', { statut: BudgetStatus.SOUMIS }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'budget_versions',
        enregistrementId: 'bv-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.BUDGET_VERSION_UPDATED, {
      budgetVersionId: 'bv-001',
    });
  });

  it('translates a P2002 on update into a CONFLICT', async () => {
    mocks.budgetVersionRepository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.update('bv-001', { nom: 'Duplicate' })).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });
});

// ─── remove (soft delete) ────────────────────────────────────────────────────

describe('BudgetVersionService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.budgetVersionRepository.findById.mockResolvedValue(buildVersion());
  });

  it('throws BUDGET_VERSION_NOT_FOUND when the version does not exist', async () => {
    mocks.budgetVersionRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.budgetVersionRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('bv-001');

    expect(mocks.budgetVersionRepository.softDelete).toHaveBeenCalledWith('bv-001');
  });

  it('writes a DELETE audit log and emits BUDGET_VERSION_DELETED', async () => {
    await mocks.service.remove('bv-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'budget_versions' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.BUDGET_VERSION_DELETED, {
      budgetVersionId: 'bv-001',
    });
  });
});
