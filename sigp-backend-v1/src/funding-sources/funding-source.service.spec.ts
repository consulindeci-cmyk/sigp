import { AuditAction, FundingSource, FundingSourceType, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { FundingSourceRepository } from './funding-source.repository';
import { FundingSourceService } from './funding-source.service';
import { FundingSourceQueryDto } from './dto/funding-source-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';

function buildSource(overrides: Partial<FundingSource> = {}): FundingSource {
  return {
    id: 'src-0001-0000-0000-000000000000',
    project_id: PROJECT_ID,
    nom: 'Banque Mondiale',
    type: FundingSourceType.BAILLEUR,
    montant: 5000000000 as unknown as Prisma.Decimal,
    pourcentage: 75 as unknown as Prisma.Decimal,
    devise: 'XOF',
    date_accord: new Date('2026-01-15'),
    date_expiry: new Date('2030-12-31'),
    contact: 'contact@worldbank.org',
    notes: 'Composante 1',
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const fundingSourceRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<FundingSourceRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJECT_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new FundingSourceService(
    fundingSourceRepository,
    projectService,
    auditService,
    eventEmitter,
  );

  return { service, fundingSourceRepository, projectService, auditService, eventEmitter };
}

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('FundingSourceService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.fundingSourceRepository.findManyPaginated.mockResolvedValue({
      sources: [buildSource()],
      total: 1,
    });
  });

  it('returns a paginated result without internal fields', async () => {
    const result = await mocks.service.findAll(new FundingSourceQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].projectId).toBe(PROJECT_ID);
  });

  it('maps Decimal montant and pourcentage to numbers', async () => {
    mocks.fundingSourceRepository.findManyPaginated.mockResolvedValue({
      sources: [
        buildSource({
          montant: 9999999 as unknown as Prisma.Decimal,
          pourcentage: 60 as unknown as Prisma.Decimal,
        }),
      ],
      total: 1,
    });

    const result = await mocks.service.findAll(new FundingSourceQueryDto());
    expect(result.data[0].montant).toBe(9999999);
    expect(result.data[0].pourcentage).toBe(60);
  });

  it('maps null pourcentage to null', async () => {
    mocks.fundingSourceRepository.findManyPaginated.mockResolvedValue({
      sources: [buildSource({ pourcentage: null })],
      total: 1,
    });

    const result = await mocks.service.findAll(new FundingSourceQueryDto());
    expect(result.data[0].pourcentage).toBeNull();
  });

  it('forwards projectId and type filters', async () => {
    const query = Object.assign(new FundingSourceQueryDto(), {
      projectId: PROJECT_ID,
      type: FundingSourceType.CONTREPARTIE_NATIONALE,
    });
    await mocks.service.findAll(query);

    expect(mocks.fundingSourceRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        type: FundingSourceType.CONTREPARTIE_NATIONALE,
      }),
    );
  });

  it('falls back to created_at when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new FundingSourceQueryDto(), {
      sortBy: 'project_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.fundingSourceRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (montant)', async () => {
    const query = Object.assign(new FundingSourceQueryDto(), {
      sortBy: 'montant',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.fundingSourceRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { montant: 'asc' } }),
    );
  });
});

// ─── findOne ─────────────────────────────────────────────────────────────────

describe('FundingSourceService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a FundingSourceResponseDto for an existing source', async () => {
    mocks.fundingSourceRepository.findById.mockResolvedValue(buildSource());

    const result = await mocks.service.findOne('src-0001-0000-0000-000000000000');

    expect(result.id).toBe('src-0001-0000-0000-000000000000');
    expect(result.nom).toBe('Banque Mondiale');
  });

  it('throws FUNDING_SOURCE_NOT_FOUND when the source does not exist', async () => {
    mocks.fundingSourceRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.FUNDING_SOURCE_NOT_FOUND,
    });
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('FundingSourceService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = {
    projectId: PROJECT_ID,
    nom: 'Banque Mondiale',
    montant: 5000000000,
  };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.fundingSourceRepository.create.mockResolvedValue(buildSource());
  });

  it('verifies the project and creates the source', async () => {
    await mocks.service.create(dto);

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJECT_ID);
    expect(mocks.fundingSourceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        nom: 'Banque Mondiale',
        montant: 5000000000,
      }),
    );
  });

  it('propagates PROJECT_NOT_FOUND (404) when the project does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_NOT_FOUND,
    });
    expect(mocks.fundingSourceRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 into a CONFLICT (409)', async () => {
    mocks.fundingSourceRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });

  it('converts dateAccord and dateExpiry ISO strings to Date objects', async () => {
    await mocks.service.create({
      ...dto,
      dateAccord: '2026-01-15',
      dateExpiry: '2030-12-31',
    });

    expect(mocks.fundingSourceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dateAccord: new Date('2026-01-15'),
        dateExpiry: new Date('2030-12-31'),
      }),
    );
  });

  it('writes a CREATE audit log and emits FUNDING_SOURCE_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'funding_sources',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.FUNDING_SOURCE_CREATED,
      expect.objectContaining({
        fundingSourceId: 'src-0001-0000-0000-000000000000',
        projectId: PROJECT_ID,
      }),
    );
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('FundingSourceService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.fundingSourceRepository.findById.mockResolvedValue(buildSource());
    mocks.fundingSourceRepository.update.mockResolvedValue(
      buildSource({ nom: 'AFD', type: FundingSourceType.AUTRE }),
    );
  });

  it('throws FUNDING_SOURCE_NOT_FOUND when the source does not exist', async () => {
    mocks.fundingSourceRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { nom: 'AFD' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('converts dateAccord ISO string to a Date on update', async () => {
    await mocks.service.update('src-0001-0000-0000-000000000000', { dateAccord: '2027-06-01' });

    expect(mocks.fundingSourceRepository.update).toHaveBeenCalledWith(
      'src-0001-0000-0000-000000000000',
      expect.objectContaining({ dateAccord: new Date('2027-06-01') }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits FUNDING_SOURCE_UPDATED', async () => {
    await mocks.service.update(
      'src-0001-0000-0000-000000000000',
      { nom: 'AFD' },
      { userId: 'admin-1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'funding_sources',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.FUNDING_SOURCE_UPDATED, {
      fundingSourceId: 'src-0001-0000-0000-000000000000',
    });
  });

  it('translates a P2002 on update into a CONFLICT', async () => {
    mocks.fundingSourceRepository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(
      mocks.service.update('src-0001-0000-0000-000000000000', { nom: 'Doublon' }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.CONFLICT });
  });
});

// ─── remove (soft delete) ────────────────────────────────────────────────────

describe('FundingSourceService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.fundingSourceRepository.findById.mockResolvedValue(buildSource());
  });

  it('throws FUNDING_SOURCE_NOT_FOUND when the source does not exist', async () => {
    mocks.fundingSourceRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.fundingSourceRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('src-0001-0000-0000-000000000000');

    expect(mocks.fundingSourceRepository.softDelete).toHaveBeenCalledWith(
      'src-0001-0000-0000-000000000000',
    );
  });

  it('writes a DELETE audit log and emits FUNDING_SOURCE_DELETED', async () => {
    await mocks.service.remove('src-0001-0000-0000-000000000000', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.DELETE,
        tableCible: 'funding_sources',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.FUNDING_SOURCE_DELETED, {
      fundingSourceId: 'src-0001-0000-0000-000000000000',
    });
  });
});
