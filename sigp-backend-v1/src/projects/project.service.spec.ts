import { AuditAction, Prisma, ProjectStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProgrammeService } from '@/programmes/programme.service';
import { UsersService } from '@/users/users.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ProjectRepository, ProjectWithManager } from './project.repository';
import { ProjectService } from './project.service';
import { ProjectQueryDto } from './dto/project-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PRG_ID = 'prg-001';

function buildProject(overrides: Partial<ProjectWithManager> = {}): ProjectWithManager {
  return {
    id: 'proj-001',
    code: 'PRJ-01',
    nom: 'Projet Santé',
    description: null,
    statut: ProjectStatus.EN_PREPARATION,
    date_debut: null,
    date_fin_prevue: null,
    date_fin_effective: null,
    date_cloture_effective: null,
    manager_id: null,
    programme_id: PRG_ID,
    budget_total: null,
    devise: 'XOF',
    pays: null,
    secteur: null,
    bailleur_principal: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    manager: null,
    ...overrides,
  };
}

function buildMocks() {
  const projectRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
    getBatchAggregations: jest.fn().mockResolvedValue(new Map()),
  } as unknown as jest.Mocked<ProjectRepository>;

  const programmeService = {
    findOne: jest.fn().mockResolvedValue({ id: PRG_ID }),
  } as unknown as jest.Mocked<ProgrammeService>;

  const usersService = {
    findOne: jest.fn().mockResolvedValue({ id: 'usr-1' }),
  } as unknown as jest.Mocked<UsersService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const risqueRepository = {} as any;
  const ptbaRepository = {} as any;

  const prisma = {
    programme: {
      findUnique: jest.fn().mockResolvedValue({
        id: PRG_ID,
        unite: {
          departement: {
            direction: {
              organisation_id: 'org-1',
            },
          },
        },
      }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        organisation_id: 'org-1',
      }),
    },
  } as any;

  const service = new ProjectService(
    projectRepository,
    programmeService,
    usersService,
    auditService,
    eventEmitter,
    risqueRepository,
    ptbaRepository,
    prisma,
  );

  return {
    service,
    projectRepository,
    programmeService,
    usersService,
    auditService,
    eventEmitter,
    risqueRepository,
    ptbaRepository,
    prisma,
  };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('ProjectService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.projectRepository.findManyPaginated.mockResolvedValue({
      projects: [buildProject()],
      total: 1,
    });
  });

  it('returns a paginated result of ProjectResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new ProjectQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].programmeId).toBe(PRG_ID);
  });

  it('maps the Decimal budget_total to a number in the response', async () => {
    mocks.projectRepository.findManyPaginated.mockResolvedValue({
      projects: [buildProject({ budget_total: 5000 as unknown as Prisma.Decimal })],
      total: 1,
    });

    const result = await mocks.service.findAll(new ProjectQueryDto());
    expect(result.data[0].budgetTotal).toBe(5000);
  });

  it('forwards programmeId, statut and managerId filters to the repository', async () => {
    const query = Object.assign(new ProjectQueryDto(), {
      programmeId: PRG_ID,
      statut: ProjectStatus.EN_COURS,
      managerId: 'usr-1',
    });
    await mocks.service.findAll(query);

    expect(mocks.projectRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        programmeId: PRG_ID,
        statut: ProjectStatus.EN_COURS,
        managerId: 'usr-1',
      }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new ProjectQueryDto(), {
      sortBy: 'programme_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.projectRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field', async () => {
    const query = Object.assign(new ProjectQueryDto(), { sortBy: 'statut', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.projectRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { statut: 'asc' } }),
    );
  });

  it('populates progressScore, tauxDecaissement, composantes, activites, and livrables from batch aggregations', async () => {
    const proj = buildProject();
    mocks.projectRepository.findManyPaginated.mockResolvedValue({ projects: [proj], total: 1 });
    mocks.projectRepository.getBatchAggregations.mockResolvedValue(
      new Map([
        [
          proj.id,
          {
            progressScore: 75,
            tauxDecaissement: 40,
            composantes: 4,
            activites: 10,
            livrables: 6,
          },
        ],
      ]),
    );

    const result = await mocks.service.findAll(new ProjectQueryDto());
    expect(result.data[0]).toMatchObject({
      progressScore: 75,
      tauxDecaissement: 40,
      composantes: 4,
      activites: 10,
      livrables: 6,
    });
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('ProjectService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a ProjectResponseDto for an existing project with batch aggregations', async () => {
    const proj = buildProject();
    mocks.projectRepository.findById.mockResolvedValue(proj);
    mocks.projectRepository.getBatchAggregations.mockResolvedValue(
      new Map([
        [
          proj.id,
          {
            progressScore: 50,
            tauxDecaissement: 20,
            composantes: 1,
            activites: 3,
            livrables: 2,
          },
        ],
      ]),
    );

    const result = await mocks.service.findOne('proj-001');

    expect(result.id).toBe('proj-001');
    expect(result.programmeId).toBe(PRG_ID);
    expect(result).toMatchObject({
      progressScore: 50,
      tauxDecaissement: 20,
      composantes: 1,
      activites: 3,
      livrables: 2,
    });
  });

  it('throws PROJECT_NOT_FOUND when the project does not exist', async () => {
    mocks.projectRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('ProjectService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { programmeId: PRG_ID, code: 'PRJ-01', nom: 'Projet Santé' };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.projectRepository.findByCode.mockResolvedValue(null);
    mocks.projectRepository.create.mockResolvedValue(buildProject());
  });

  it('verifies the parent programme exists before creating', async () => {
    await mocks.service.create(dto);

    expect(mocks.prisma.programme.findUnique).toHaveBeenCalledWith({
      where: { id: PRG_ID },
      include: expect.any(Object),
    });
    expect(mocks.projectRepository.create).toHaveBeenCalled();
  });

  it('propagates PROGRAMME_NOT_FOUND (404) when the programme does not exist', async () => {
    mocks.prisma.programme.findUnique.mockResolvedValueOnce(null);

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROGRAMME_NOT_FOUND,
    });
    expect(mocks.projectRepository.create).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when user organisation does not match programme organisation on create', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce({ organisation_id: 'org-2' });

    await expect(
      mocks.service.create(dto, { userId: 'usr-1', userRole: 'COORDINATEUR' as any }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.projectRepository.create).not.toHaveBeenCalled();
  });

  it('verifies the manager exists when managerId is provided', async () => {
    await mocks.service.create({ ...dto, managerId: 'usr-1' });

    expect(mocks.usersService.findOne).toHaveBeenCalledWith('usr-1');
  });

  it('propagates USER_NOT_FOUND (404) when the manager does not exist', async () => {
    mocks.usersService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.USER_NOT_FOUND, 'Utilisateur introuvable'),
    );

    await expect(mocks.service.create({ ...dto, managerId: 'ghost' })).rejects.toMatchObject({
      errorCode: ErrorCode.USER_NOT_FOUND,
    });
    expect(mocks.projectRepository.create).not.toHaveBeenCalled();
  });

  it('throws PROJECT_CODE_TAKEN when the code already exists', async () => {
    mocks.projectRepository.findByCode.mockResolvedValue(buildProject());

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_CODE_TAKEN,
    });
    expect(mocks.projectRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 into PROJECT_CODE_TAKEN', async () => {
    mocks.projectRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['code'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_CODE_TAKEN,
    });
  });

  it('defaults the statut to EN_PREPARATION when omitted', async () => {
    await mocks.service.create(dto);

    expect(mocks.projectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ statut: ProjectStatus.EN_PREPARATION }),
    );
  });

  it('converts ISO date strings to Date objects', async () => {
    await mocks.service.create({ ...dto, dateDebut: '2026-01-01', dateFinPrevue: '2026-12-31' });

    const arg = mocks.projectRepository.create.mock.calls[0][0];
    expect(arg.dateDebut).toBeInstanceOf(Date);
    expect(arg.dateFinPrevue).toBeInstanceOf(Date);
  });

  it('writes a CREATE audit log and emits PROJECT_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'projects',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.PROJECT_CREATED,
      expect.objectContaining({ projectId: 'proj-001', programmeId: PRG_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('ProjectService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.projectRepository.findById.mockResolvedValue(buildProject());
    mocks.projectRepository.update.mockResolvedValue(buildProject({ nom: 'Nouveau nom' }));
  });

  it('throws PROJECT_NOT_FOUND when the project does not exist', async () => {
    mocks.projectRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { nom: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('re-verifies the new programme when programmeId changes', async () => {
    await mocks.service.update('proj-001', { programmeId: 'prg-999' });

    expect(mocks.prisma.programme.findUnique).toHaveBeenCalledWith({
      where: { id: 'prg-999' },
      include: expect.any(Object),
    });
    expect(mocks.projectRepository.update).toHaveBeenCalled();
  });

  it('does not re-verify the programme when programmeId is unchanged', async () => {
    await mocks.service.update('proj-001', { programmeId: PRG_ID });

    expect(mocks.prisma.programme.findUnique).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when user organisation does not match target programme organisation on update', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce({ organisation_id: 'org-2' });

    await expect(
      mocks.service.update('proj-001', { programmeId: 'prg-999' }, { userId: 'usr-1', userRole: 'COORDINATEUR' as any }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.projectRepository.update).not.toHaveBeenCalled();
  });

  it('writes an UPDATE audit log with avant/apres and emits PROJECT_UPDATED', async () => {
    await mocks.service.update('proj-001', { nom: 'Nouveau nom' }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'projects',
        enregistrementId: 'proj-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.PROJECT_UPDATED, {
      projectId: 'proj-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('ProjectService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.projectRepository.findById.mockResolvedValue(buildProject());
  });

  it('throws PROJECT_NOT_FOUND when the project does not exist', async () => {
    mocks.projectRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.projectRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('proj-001');

    expect(mocks.projectRepository.softDelete).toHaveBeenCalledWith('proj-001');
  });

  it('writes a DELETE audit log and emits PROJECT_DELETED', async () => {
    await mocks.service.remove('proj-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'projects' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.PROJECT_DELETED, {
      projectId: 'proj-001',
    });
  });
});
