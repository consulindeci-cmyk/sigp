import { AuditAction, Organisation, OrganisationType, Prisma } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrganisationRepository } from './organisation.repository';
import { OrganisationService } from './organisation.service';
import { OrganisationQueryDto } from './dto/organisation-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

function buildOrg(overrides: Partial<Organisation> = {}): Organisation {
  return {
    id: 'org-001',
    code: 'MIN-SANTE',
    nom: 'Ministère de la Santé',
    type: OrganisationType.MINISTERE,
    description: null,
    email: null,
    telephone: null,
    site_web: null,
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
  const organisationRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<OrganisationRepository>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new OrganisationService(organisationRepository, auditService, eventEmitter);

  return { service, organisationRepository, auditService, eventEmitter };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('OrganisationService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.organisationRepository.findManyPaginated.mockResolvedValue({
      organisations: [buildOrg()],
      total: 1,
    });
  });

  it('returns a paginated result of OrganisationResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new OrganisationQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].code).toBe('MIN-SANTE');
  });

  it('forwards type and actif filters to the repository', async () => {
    const query = Object.assign(new OrganisationQueryDto(), {
      type: OrganisationType.ONG,
      actif: false,
    });
    await mocks.service.findAll(query);

    expect(mocks.organisationRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ type: OrganisationType.ONG, actif: false }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new OrganisationQueryDto(), {
      sortBy: 'site_web; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.organisationRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field', async () => {
    const query = Object.assign(new OrganisationQueryDto(), { sortBy: 'code', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.organisationRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { code: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('OrganisationService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns an OrganisationResponseDto for an existing organisation', async () => {
    mocks.organisationRepository.findById.mockResolvedValue(buildOrg());

    const result = await mocks.service.findOne('org-001');

    expect(result.id).toBe('org-001');
    expect(result.siteWeb).toBeNull();
  });

  it('throws ORGANISATION_NOT_FOUND when the organisation does not exist', async () => {
    mocks.organisationRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.ORGANISATION_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('OrganisationService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { code: 'MIN-SANTE', nom: 'Ministère de la Santé', type: OrganisationType.MINISTERE };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.organisationRepository.findByCode.mockResolvedValue(null);
    mocks.organisationRepository.findByName.mockResolvedValue(null);
    mocks.organisationRepository.create.mockResolvedValue(buildOrg());
  });

  it('creates the organisation and returns the mapped view', async () => {
    const result = await mocks.service.create(dto);

    expect(mocks.organisationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'MIN-SANTE', type: OrganisationType.MINISTERE }),
    );
    expect(result.code).toBe('MIN-SANTE');
  });

  it('throws ORGANISATION_CODE_TAKEN when the code already exists', async () => {
    mocks.organisationRepository.findByCode.mockResolvedValue(buildOrg());

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.ORGANISATION_CODE_TAKEN,
    });
    expect(mocks.organisationRepository.create).not.toHaveBeenCalled();
  });

  it('throws ORGANISATION_NAME_TAKEN when the name already exists', async () => {
    mocks.organisationRepository.findByName.mockResolvedValue(buildOrg({ code: 'OTHER' }));

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.ORGANISATION_NAME_TAKEN,
    });
    expect(mocks.organisationRepository.create).not.toHaveBeenCalled();
  });

  it('defaults the type to AUTRE when omitted', async () => {
    mocks.organisationRepository.create.mockResolvedValue(
      buildOrg({ type: OrganisationType.AUTRE }),
    );
    await mocks.service.create({ code: 'X', nom: 'X Org' });

    expect(mocks.organisationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: OrganisationType.AUTRE }),
    );
  });

  it('translates a Prisma P2002 on code into ORGANISATION_CODE_TAKEN', async () => {
    mocks.organisationRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['code'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.ORGANISATION_CODE_TAKEN,
    });
  });

  it('translates a Prisma P2002 on nom into ORGANISATION_NAME_TAKEN', async () => {
    mocks.organisationRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['nom'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.ORGANISATION_NAME_TAKEN,
    });
  });

  it('writes a CREATE audit log and emits ORGANISATION_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'organisations',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.ORGANISATION_CREATED,
      expect.objectContaining({ organisationId: 'org-001' }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('OrganisationService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.organisationRepository.findById.mockResolvedValue(buildOrg());
    mocks.organisationRepository.findByName.mockResolvedValue(null);
    mocks.organisationRepository.update.mockResolvedValue(
      buildOrg({ nom: 'Nouveau nom', actif: false }),
    );
  });

  it('throws ORGANISATION_NOT_FOUND when the organisation does not exist', async () => {
    mocks.organisationRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { nom: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws ORGANISATION_NAME_TAKEN when the new name collides with another organisation', async () => {
    mocks.organisationRepository.findByName.mockResolvedValue(buildOrg({ id: 'other' }));

    await expect(mocks.service.update('org-001', { nom: 'Déjà pris' })).rejects.toMatchObject({
      errorCode: ErrorCode.ORGANISATION_NAME_TAKEN,
    });
    expect(mocks.organisationRepository.update).not.toHaveBeenCalled();
  });

  it('does not check name uniqueness when the name is unchanged', async () => {
    await mocks.service.update('org-001', { nom: 'Ministère de la Santé', actif: false });

    expect(mocks.organisationRepository.findByName).not.toHaveBeenCalled();
    expect(mocks.organisationRepository.update).toHaveBeenCalled();
  });

  it('writes an UPDATE audit log with avant/apres and emits ORGANISATION_UPDATED', async () => {
    await mocks.service.update('org-001', { nom: 'Nouveau nom' }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'organisations',
        enregistrementId: 'org-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.ORGANISATION_UPDATED, {
      organisationId: 'org-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('OrganisationService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.organisationRepository.findById.mockResolvedValue(buildOrg());
  });

  it('throws ORGANISATION_NOT_FOUND when the organisation does not exist', async () => {
    mocks.organisationRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.organisationRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('org-001');

    expect(mocks.organisationRepository.softDelete).toHaveBeenCalledWith('org-001');
  });

  it('writes a DELETE audit log and emits ORGANISATION_DELETED', async () => {
    await mocks.service.remove('org-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'organisations' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.ORGANISATION_DELETED, {
      organisationId: 'org-001',
    });
  });
});
