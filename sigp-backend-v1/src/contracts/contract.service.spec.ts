import { AuditAction, Contract, ContractStatus, ContractType, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { FundingSourceService } from '@/funding-sources/funding-source.service';
import { ContractRepository } from './contract.repository';
import { ContractService } from './contract.service';
import { ContractQueryDto } from './dto/contract-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';
const SOURCE_ID = 'src-0001-0000-0000-000000000000';

function buildContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'ctr-0001-0000-0000-000000000000',
    project_id: PROJECT_ID,
    marche_id: null,
    numero: 'CTR-2026-001',
    intitule: 'Contrat de fourniture',
    type: ContractType.MARCHE,
    statut: ContractStatus.ACTIF,
    titulaire: 'Entreprise Alpha',
    montant: 10000000 as unknown as Prisma.Decimal,
    devise: 'XOF',
    date_signature: new Date('2026-01-15'),
    date_debut: new Date('2026-02-01'),
    date_fin: new Date('2026-12-31'),
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
  const contractRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ContractRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJECT_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const fundingSourceService = {
    findOne: jest.fn().mockResolvedValue({ id: SOURCE_ID, projectId: PROJECT_ID }),
  } as unknown as jest.Mocked<FundingSourceService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new ContractService(
    contractRepository,
    projectService,
    fundingSourceService,
    auditService,
    eventEmitter,
  );

  return {
    service,
    contractRepository,
    projectService,
    fundingSourceService,
    auditService,
    eventEmitter,
  };
}

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('ContractService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.contractRepository.findManyPaginated.mockResolvedValue({
      contracts: [buildContract()],
      total: 1,
    });
  });

  it('returns a paginated result without internal fields', async () => {
    const result = await mocks.service.findAll(new ContractQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0].projectId).toBe(PROJECT_ID);
  });

  it('maps Decimal montant to a number', async () => {
    mocks.contractRepository.findManyPaginated.mockResolvedValue({
      contracts: [buildContract({ montant: 99999999 as unknown as Prisma.Decimal })],
      total: 1,
    });

    const result = await mocks.service.findAll(new ContractQueryDto());
    expect(result.data[0].montant).toBe(99999999);
  });

  it('forwards all query filters to the repository', async () => {
    const query = Object.assign(new ContractQueryDto(), {
      projectId: PROJECT_ID,
      type: ContractType.CONVENTION,
      statut: ContractStatus.CLOTURE,
    });
    await mocks.service.findAll(query);

    expect(mocks.contractRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        type: ContractType.CONVENTION,
        statut: ContractStatus.CLOTURE,
      }),
    );
  });

  it('falls back to created_at when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new ContractQueryDto(), {
      sortBy: 'project_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.contractRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (montant)', async () => {
    const query = Object.assign(new ContractQueryDto(), { sortBy: 'montant', sortOrder: 'desc' });
    await mocks.service.findAll(query);

    expect(mocks.contractRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { montant: 'desc' } }),
    );
  });
});

// ─── findOne ─────────────────────────────────────────────────────────────────

describe('ContractService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a ContractResponseDto for an existing contract', async () => {
    mocks.contractRepository.findById.mockResolvedValue(buildContract());

    const result = await mocks.service.findOne('ctr-0001-0000-0000-000000000000');

    expect(result.id).toBe('ctr-0001-0000-0000-000000000000');
    expect(result.statut).toBe(ContractStatus.ACTIF);
  });

  it('throws CONTRACT_NOT_FOUND when it does not exist', async () => {
    mocks.contractRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.CONTRACT_NOT_FOUND,
    });
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('ContractService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.contractRepository.create.mockResolvedValue(buildContract());
  });

  it('creates a contract after validating the project', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      numero: 'CTR-2026-001',
      intitule: 'Contrat test',
      titulaire: 'Entreprise Alpha',
      montant: 10000000,
    });

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJECT_ID);
    expect(mocks.contractRepository.create).toHaveBeenCalled();
  });

  it('validates fundingSourceId when provided and project matches', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      numero: 'CTR-2026-001',
      intitule: 'Contrat test',
      titulaire: 'Entreprise Alpha',
      montant: 10000000,
      fundingSourceId: SOURCE_ID,
    });

    expect(mocks.fundingSourceService.findOne).toHaveBeenCalledWith(SOURCE_ID);
    expect(mocks.contractRepository.create).toHaveBeenCalled();
  });

  it('throws 404 when projectId does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(
      mocks.service.create({
        projectId: PROJECT_ID,
        numero: 'CTR-2026-001',
        intitule: 'Contrat test',
        titulaire: 'Entreprise Alpha',
        montant: 10000000,
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PROJECT_NOT_FOUND });
    expect(mocks.contractRepository.create).not.toHaveBeenCalled();
  });

  it('throws 404 when fundingSourceId does not exist', async () => {
    mocks.fundingSourceService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.FUNDING_SOURCE_NOT_FOUND, 'Source introuvable'),
    );

    await expect(
      mocks.service.create({
        projectId: PROJECT_ID,
        numero: 'CTR-2026-001',
        intitule: 'Contrat test',
        titulaire: 'Entreprise Alpha',
        montant: 10000000,
        fundingSourceId: SOURCE_ID,
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.FUNDING_SOURCE_NOT_FOUND });
    expect(mocks.contractRepository.create).not.toHaveBeenCalled();
  });

  it('throws CONTRACT_COHERENCE_VIOLATION when fundingSource belongs to a different project', async () => {
    mocks.fundingSourceService.findOne.mockResolvedValue({
      id: SOURCE_ID,
      projectId: 'other-project-id',
    } as never);

    await expect(
      mocks.service.create({
        projectId: PROJECT_ID,
        numero: 'CTR-2026-001',
        intitule: 'Contrat test',
        titulaire: 'Entreprise Alpha',
        montant: 10000000,
        fundingSourceId: SOURCE_ID,
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.CONTRACT_COHERENCE_VIOLATION });
    expect(mocks.contractRepository.create).not.toHaveBeenCalled();
  });

  it('converts date strings to Date objects', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      numero: 'CTR-2026-001',
      intitule: 'Contrat test',
      titulaire: 'Entreprise Alpha',
      montant: 10000000,
      dateSignature: '2026-01-15',
      dateDebut: '2026-02-01',
      dateFin: '2026-12-31',
    });

    expect(mocks.contractRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dateSignature: new Date('2026-01-15'),
        dateDebut: new Date('2026-02-01'),
        dateFin: new Date('2026-12-31'),
      }),
    );
  });

  it('translates a Prisma P2002 into a CONFLICT (409)', async () => {
    mocks.contractRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(
      mocks.service.create({
        projectId: PROJECT_ID,
        numero: 'CTR-2026-001',
        intitule: 'Contrat test',
        titulaire: 'Entreprise Alpha',
        montant: 10000000,
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.CONFLICT });
  });

  it('writes a CREATE audit log and emits CONTRACT_CREATED', async () => {
    await mocks.service.create(
      {
        projectId: PROJECT_ID,
        numero: 'CTR-2026-001',
        intitule: 'Contrat test',
        titulaire: 'Entreprise Alpha',
        montant: 10000000,
      },
      { userId: 'admin-1', ip: '127.0.0.1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'contracts',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.CONTRACT_CREATED,
      expect.objectContaining({ contractId: 'ctr-0001-0000-0000-000000000000' }),
    );
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('ContractService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.contractRepository.findById.mockResolvedValue(buildContract());
    mocks.contractRepository.update.mockResolvedValue(
      buildContract({ statut: ContractStatus.CLOTURE }),
    );
  });

  it('throws CONTRACT_NOT_FOUND when it does not exist', async () => {
    mocks.contractRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.service.update('missing', { statut: ContractStatus.CLOTURE }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('converts date strings to Date objects on update', async () => {
    await mocks.service.update('ctr-0001-0000-0000-000000000000', { dateFin: '2026-12-31' });

    expect(mocks.contractRepository.update).toHaveBeenCalledWith(
      'ctr-0001-0000-0000-000000000000',
      expect.objectContaining({ dateFin: new Date('2026-12-31') }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits CONTRACT_UPDATED', async () => {
    await mocks.service.update(
      'ctr-0001-0000-0000-000000000000',
      { statut: ContractStatus.CLOTURE },
      { userId: 'admin-1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'contracts',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.CONTRACT_UPDATED, {
      contractId: 'ctr-0001-0000-0000-000000000000',
    });
  });

  it('translates a P2002 on update into a CONFLICT', async () => {
    mocks.contractRepository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(
      mocks.service.update('ctr-0001-0000-0000-000000000000', { numero: 'DUP-001' }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.CONFLICT });
  });
});

// ─── remove (soft delete) ────────────────────────────────────────────────────

describe('ContractService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.contractRepository.findById.mockResolvedValue(buildContract());
  });

  it('throws CONTRACT_NOT_FOUND when it does not exist', async () => {
    mocks.contractRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.contractRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('ctr-0001-0000-0000-000000000000');

    expect(mocks.contractRepository.softDelete).toHaveBeenCalledWith(
      'ctr-0001-0000-0000-000000000000',
    );
  });

  it('writes a DELETE audit log and emits CONTRACT_DELETED', async () => {
    await mocks.service.remove('ctr-0001-0000-0000-000000000000', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'contracts' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.CONTRACT_DELETED, {
      contractId: 'ctr-0001-0000-0000-000000000000',
    });
  });
});
