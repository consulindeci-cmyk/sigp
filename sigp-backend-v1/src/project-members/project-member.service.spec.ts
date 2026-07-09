import { AuditAction, Prisma, ProjectMember, RoleMembreProjet } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { UsersService } from '@/users/users.service';
import { ProjectMemberRepository } from './project-member.repository';
import { ProjectMemberService } from './project-member.service';
import { ProjectMemberQueryDto } from './dto/project-member-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PROJ_ID = 'proj-001';
const USER_ID = 'usr-001';

function buildMember(overrides: Partial<ProjectMember> = {}): ProjectMember {
  return {
    id: 'pm-001',
    project_id: PROJ_ID,
    user_id: USER_ID,
    role_projet: RoleMembreProjet.MEMBRE,
    actif: true,
    date_debut: null,
    date_fin: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const projectMemberRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    findByUser: jest.fn(),
    findByProjectAndUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProjectMemberRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJ_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const usersService = {
    findOne: jest.fn().mockResolvedValue({ id: USER_ID }),
  } as unknown as jest.Mocked<UsersService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new ProjectMemberService(
    projectMemberRepository,
    projectService,
    usersService,
    auditService,
    eventEmitter,
  );

  return {
    service,
    projectMemberRepository,
    projectService,
    usersService,
    auditService,
    eventEmitter,
  };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('ProjectMemberService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.projectMemberRepository.findManyPaginated.mockResolvedValue({
      members: [buildMember()],
      total: 1,
    });
  });

  it('returns a paginated result of ProjectMemberResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new ProjectMemberQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].projectId).toBe(PROJ_ID);
    expect(result.data[0].role).toBe(RoleMembreProjet.MEMBRE);
  });

  it('forwards projectId, userId, role and actif filters', async () => {
    const query = Object.assign(new ProjectMemberQueryDto(), {
      projectId: PROJ_ID,
      userId: USER_ID,
      role: RoleMembreProjet.CHEF_PROJET,
      actif: false,
    });
    await mocks.service.findAll(query);

    expect(mocks.projectMemberRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJ_ID,
        userId: USER_ID,
        role: RoleMembreProjet.CHEF_PROJET,
        actif: false,
      }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new ProjectMemberQueryDto(), {
      sortBy: 'user_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.projectMemberRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field (role_projet)', async () => {
    const query = Object.assign(new ProjectMemberQueryDto(), {
      sortBy: 'role_projet',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.projectMemberRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { role_projet: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('ProjectMemberService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a ProjectMemberResponseDto for an existing member', async () => {
    mocks.projectMemberRepository.findById.mockResolvedValue(buildMember());

    const result = await mocks.service.findOne('pm-001');

    expect(result.id).toBe('pm-001');
    expect(result.userId).toBe(USER_ID);
  });

  it('throws PROJECT_MEMBER_NOT_FOUND when the member does not exist', async () => {
    mocks.projectMemberRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_MEMBER_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('ProjectMemberService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { projectId: PROJ_ID, userId: USER_ID };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.projectMemberRepository.findByProjectAndUser.mockResolvedValue(null);
    mocks.projectMemberRepository.create.mockResolvedValue(buildMember());
  });

  it('verifies the project and the user exist before creating', async () => {
    await mocks.service.create(dto);

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJ_ID);
    expect(mocks.usersService.findOne).toHaveBeenCalledWith(USER_ID);
    expect(mocks.projectMemberRepository.create).toHaveBeenCalled();
  });

  it('propagates PROJECT_NOT_FOUND (404) when the project does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_NOT_FOUND,
    });
    expect(mocks.projectMemberRepository.create).not.toHaveBeenCalled();
  });

  it('propagates USER_NOT_FOUND (404) when the user does not exist', async () => {
    mocks.usersService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.USER_NOT_FOUND, 'Utilisateur introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.USER_NOT_FOUND,
    });
    expect(mocks.projectMemberRepository.create).not.toHaveBeenCalled();
  });

  it('throws PROJECT_MEMBER_ALREADY_EXISTS when the couple already exists', async () => {
    mocks.projectMemberRepository.findByProjectAndUser.mockResolvedValue(buildMember());

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_MEMBER_ALREADY_EXISTS,
    });
    expect(mocks.projectMemberRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 into PROJECT_MEMBER_ALREADY_EXISTS', async () => {
    mocks.projectMemberRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
        meta: { target: ['project_id', 'user_id'] },
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_MEMBER_ALREADY_EXISTS,
    });
  });

  it('defaults the role to MEMBRE when omitted', async () => {
    await mocks.service.create(dto);

    expect(mocks.projectMemberRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: RoleMembreProjet.MEMBRE }),
    );
  });

  it('writes a CREATE audit log and emits PROJECT_MEMBER_ADDED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'project_members',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.PROJECT_MEMBER_ADDED,
      expect.objectContaining({ projectMemberId: 'pm-001', projectId: PROJ_ID, userId: USER_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('ProjectMemberService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.projectMemberRepository.findById.mockResolvedValue(buildMember());
    mocks.projectMemberRepository.update.mockResolvedValue(
      buildMember({ role_projet: RoleMembreProjet.VALIDATEUR, actif: false }),
    );
  });

  it('throws PROJECT_MEMBER_NOT_FOUND when the member does not exist', async () => {
    mocks.projectMemberRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { actif: false })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('forwards role and actif to the repository', async () => {
    await mocks.service.update('pm-001', { role: RoleMembreProjet.VALIDATEUR, actif: false });

    expect(mocks.projectMemberRepository.update).toHaveBeenCalledWith(
      'pm-001',
      expect.objectContaining({ role: RoleMembreProjet.VALIDATEUR, actif: false }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits PROJECT_MEMBER_UPDATED', async () => {
    await mocks.service.update('pm-001', { actif: false }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'project_members',
        enregistrementId: 'pm-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.PROJECT_MEMBER_UPDATED, {
      projectMemberId: 'pm-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('ProjectMemberService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.projectMemberRepository.findById.mockResolvedValue(buildMember());
  });

  it('throws PROJECT_MEMBER_NOT_FOUND when the member does not exist', async () => {
    mocks.projectMemberRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.projectMemberRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('pm-001');

    expect(mocks.projectMemberRepository.softDelete).toHaveBeenCalledWith('pm-001');
  });

  it('writes a DELETE audit log and emits PROJECT_MEMBER_REMOVED', async () => {
    await mocks.service.remove('pm-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'project_members' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.PROJECT_MEMBER_REMOVED,
      expect.objectContaining({ projectMemberId: 'pm-001', projectId: PROJ_ID, userId: USER_ID }),
    );
  });
});
