import { AuditAction, PpmMarche, PpmMarcheStatus, PpmTypeMarche, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { PpmRepository } from './ppm.repository';
import { PpmService } from './ppm.service';
import { PpmQueryDto } from './dto/ppm-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';

function buildMarche(overrides: Partial<PpmMarche> = {}): PpmMarche {
  return {
    id: 'ppm-0001-0000-0000-000000000000',
    project_id: PROJECT_ID,
    code: 'MRC-2026-001',
    intitule: 'Acquisition de matériel informatique',
    type: PpmTypeMarche.FOURNITURES,
    statut: PpmMarcheStatus.EN_PREPARATION,
    montant_estime: 5000000 as unknown as Prisma.Decimal,
    montant_signe: null,
    date_lancement_prevu: new Date('2026-03-01'),
    date_soumission_prevu: new Date('2026-04-01'),
    date_attribution: null,
    date_signature: null,
    date_fin_prevue: new Date('2026-12-31'),
    date_fin_effective: null,
    titulaire: null,
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
  const ppmRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<PpmRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJECT_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new PpmService(ppmRepository, projectService, auditService, eventEmitter);

  return { service, ppmRepository, projectService, auditService, eventEmitter };
}

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('PpmService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ppmRepository.findManyPaginated.mockResolvedValue({
      marches: [buildMarche()],
      total: 1,
    });
  });

  it('returns a paginated result without internal fields', async () => {
    const result = await mocks.service.findAll(new PpmQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0].projectId).toBe(PROJECT_ID);
  });

  it('maps Decimal montant_estime to a number', async () => {
    mocks.ppmRepository.findManyPaginated.mockResolvedValue({
      marches: [buildMarche({ montant_estime: 99999999 as unknown as Prisma.Decimal })],
      total: 1,
    });

    const result = await mocks.service.findAll(new PpmQueryDto());
    expect(result.data[0].montantEstime).toBe(99999999);
  });

  it('returns null for null montant_signe', async () => {
    const result = await mocks.service.findAll(new PpmQueryDto());
    expect(result.data[0].montantSigne).toBeNull();
  });

  it('forwards all query filters to the repository', async () => {
    const query = Object.assign(new PpmQueryDto(), {
      projectId: PROJECT_ID,
      type: PpmTypeMarche.TRAVAUX,
      statut: PpmMarcheStatus.SIGNE,
    });
    await mocks.service.findAll(query);

    expect(mocks.ppmRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        type: PpmTypeMarche.TRAVAUX,
        statut: PpmMarcheStatus.SIGNE,
      }),
    );
  });

  it('falls back to created_at when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new PpmQueryDto(), {
      sortBy: 'project_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.ppmRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (montant_estime)', async () => {
    const query = Object.assign(new PpmQueryDto(), {
      sortBy: 'montant_estime',
      sortOrder: 'desc',
    });
    await mocks.service.findAll(query);

    expect(mocks.ppmRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { montant_estime: 'desc' } }),
    );
  });

  it('honours whitelisted sort field (code)', async () => {
    const query = Object.assign(new PpmQueryDto(), { sortBy: 'code', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.ppmRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { code: 'asc' } }),
    );
  });
});

// ─── findOne ─────────────────────────────────────────────────────────────────

describe('PpmService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a PpmResponseDto for an existing marché', async () => {
    mocks.ppmRepository.findById.mockResolvedValue(buildMarche());

    const result = await mocks.service.findOne('ppm-0001-0000-0000-000000000000');

    expect(result.id).toBe('ppm-0001-0000-0000-000000000000');
    expect(result.statut).toBe(PpmMarcheStatus.EN_PREPARATION);
  });

  it('throws PPM_MARCHE_NOT_FOUND when it does not exist', async () => {
    mocks.ppmRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.PPM_MARCHE_NOT_FOUND,
    });
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('PpmService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ppmRepository.create.mockResolvedValue(buildMarche());
  });

  it('creates a marché after validating the project', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      code: 'MRC-2026-001',
      intitule: 'Acquisition matériel',
      type: PpmTypeMarche.FOURNITURES,
    });

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJECT_ID);
    expect(mocks.ppmRepository.create).toHaveBeenCalled();
  });

  it('throws 404 when projectId does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(
      mocks.service.create({
        projectId: PROJECT_ID,
        code: 'MRC-001',
        intitule: 'Test',
        type: PpmTypeMarche.FOURNITURES,
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PROJECT_NOT_FOUND });
    expect(mocks.ppmRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 into PPM_MARCHE_CODE_TAKEN (409)', async () => {
    mocks.ppmRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(
      mocks.service.create({
        projectId: PROJECT_ID,
        code: 'MRC-DUP',
        intitule: 'Test',
        type: PpmTypeMarche.FOURNITURES,
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PPM_MARCHE_CODE_TAKEN });
  });

  it('converts date strings to Date objects', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      code: 'MRC-001',
      intitule: 'Test',
      type: PpmTypeMarche.FOURNITURES,
      dateLancementPrevu: '2026-03-01',
      dateFinPrevue: '2026-12-31',
    });

    expect(mocks.ppmRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dateLancementPrevu: new Date('2026-03-01'),
        dateFinPrevue: new Date('2026-12-31'),
      }),
    );
  });

  it('writes a CREATE audit log and emits PPM_CREATED', async () => {
    await mocks.service.create(
      {
        projectId: PROJECT_ID,
        code: 'MRC-2026-001',
        intitule: 'Acquisition matériel',
        type: PpmTypeMarche.FOURNITURES,
      },
      { userId: 'admin-1', ip: '127.0.0.1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'ppm_marches',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.PPM_CREATED,
      expect.objectContaining({ marcheId: 'ppm-0001-0000-0000-000000000000' }),
    );
  });

  it('passes null for absent optional date fields', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      code: 'MRC-001',
      intitule: 'Test',
      type: PpmTypeMarche.FOURNITURES,
    });

    expect(mocks.ppmRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dateLancementPrevu: null,
        dateAttribution: null,
        dateFinEffective: null,
      }),
    );
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('PpmService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ppmRepository.findById.mockResolvedValue(buildMarche());
    mocks.ppmRepository.update.mockResolvedValue(buildMarche({ statut: PpmMarcheStatus.SIGNE }));
  });

  it('throws PPM_MARCHE_NOT_FOUND when it does not exist', async () => {
    mocks.ppmRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.service.update('missing', { statut: PpmMarcheStatus.SIGNE }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('converts date strings to Date objects on update', async () => {
    await mocks.service.update('ppm-0001-0000-0000-000000000000', {
      dateFinEffective: '2026-12-01',
    });

    expect(mocks.ppmRepository.update).toHaveBeenCalledWith(
      'ppm-0001-0000-0000-000000000000',
      expect.objectContaining({ dateFinEffective: new Date('2026-12-01') }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits PPM_UPDATED', async () => {
    await mocks.service.update(
      'ppm-0001-0000-0000-000000000000',
      { statut: PpmMarcheStatus.SIGNE },
      { userId: 'admin-1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'ppm_marches',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.PPM_UPDATED, {
      marcheId: 'ppm-0001-0000-0000-000000000000',
    });
  });

  it('translates a P2002 on update into PPM_MARCHE_CODE_TAKEN', async () => {
    mocks.ppmRepository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(
      mocks.service.update('ppm-0001-0000-0000-000000000000', { code: 'DUP-001' }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PPM_MARCHE_CODE_TAKEN });
  });
});

// ─── remove (soft delete) ────────────────────────────────────────────────────

describe('PpmService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ppmRepository.findById.mockResolvedValue(buildMarche());
  });

  it('throws PPM_MARCHE_NOT_FOUND when it does not exist', async () => {
    mocks.ppmRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.ppmRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('ppm-0001-0000-0000-000000000000');

    expect(mocks.ppmRepository.softDelete).toHaveBeenCalledWith('ppm-0001-0000-0000-000000000000');
  });

  it('writes a DELETE audit log and emits PPM_DELETED', async () => {
    await mocks.service.remove('ppm-0001-0000-0000-000000000000', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'ppm_marches' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.PPM_DELETED, {
      marcheId: 'ppm-0001-0000-0000-000000000000',
    });
  });
});
