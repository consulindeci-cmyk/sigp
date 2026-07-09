import * as argon2 from 'argon2';
import { AuditAction, Prisma, User, UserRole } from '@prisma/client';
import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UserQueryDto, UserStatusFilter } from './dto/user-query.dto';

jest.mock('argon2', () => ({ hash: jest.fn(), argon2id: 2 }));

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'uuid-001',
    nom: 'Doe',
    prenom: 'John',
    email: 'john@sigp.local',
    mot_de_passe: '$argon2id$secret-hash',
    role: UserRole.VIEWER,
    actif: true,
    langue_preference: 'fr',
    telephone: null,
    avatar_url: null,
    derniere_connexion: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    organisation_id: null,
    ...overrides,
  };
}

function buildMocks() {
  const usersRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<UsersRepository>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new UsersService(usersRepository, auditService, eventEmitter);

  return { service, usersRepository, auditService, eventEmitter };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('UsersService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.usersRepository.findManyPaginated.mockResolvedValue({
      users: [buildUser()],
      total: 1,
    });
  });

  it('returns a paginated result of UserResponseDto without the password hash', async () => {
    const result = await mocks.service.findAll(new UserQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('mot_de_passe');
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0].email).toBe('john@sigp.local');
  });

  it('maps status=active to actif=true filter', async () => {
    const query = Object.assign(new UserQueryDto(), { status: UserStatusFilter.ACTIVE });
    await mocks.service.findAll(query);

    expect(mocks.usersRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ actif: true }),
    );
  });

  it('maps status=inactive to actif=false filter', async () => {
    const query = Object.assign(new UserQueryDto(), { status: UserStatusFilter.INACTIVE });
    await mocks.service.findAll(query);

    expect(mocks.usersRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ actif: false }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new UserQueryDto(), {
      sortBy: 'mot_de_passe; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.usersRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field', async () => {
    const query = Object.assign(new UserQueryDto(), { sortBy: 'nom', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.usersRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { nom: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('UsersService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a UserResponseDto for an existing user', async () => {
    mocks.usersRepository.findById.mockResolvedValue(buildUser());

    const result = await mocks.service.findOne('uuid-001');

    expect(result.id).toBe('uuid-001');
    expect(result).not.toHaveProperty('mot_de_passe');
  });

  it('throws USER_NOT_FOUND when the user does not exist', async () => {
    mocks.usersRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.USER_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('UsersService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = {
    nom: 'Doe',
    prenom: 'John',
    email: 'john@sigp.local',
    password: 'Str0ng@Pass',
    role: UserRole.FINANCIER,
  };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.usersRepository.findByEmail.mockResolvedValue(null);
    mocks.usersRepository.create.mockResolvedValue(
      buildUser({ role: UserRole.FINANCIER, mot_de_passe: '$argon2id$hashed' }),
    );
    (argon2.hash as jest.Mock).mockResolvedValue('$argon2id$hashed');
  });

  it('hashes the password with argon2id (never bcrypt/SHA)', async () => {
    await mocks.service.create(dto);

    expect(argon2.hash).toHaveBeenCalledWith('Str0ng@Pass', { type: argon2.argon2id });
    expect(mocks.usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ motDePasse: '$argon2id$hashed', role: UserRole.FINANCIER }),
    );
  });

  it('never returns the password hash in the response', async () => {
    const result = await mocks.service.create(dto);
    expect(result).not.toHaveProperty('mot_de_passe');
    expect(result).not.toHaveProperty('password');
  });

  it('throws USER_EMAIL_TAKEN when the email already exists', async () => {
    mocks.usersRepository.findByEmail.mockResolvedValue(buildUser());

    await expect(mocks.service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(mocks.usersRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 unique violation into USER_EMAIL_TAKEN', async () => {
    mocks.usersRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: '6',
      }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.USER_EMAIL_TAKEN,
    });
  });

  it('defaults the role to VIEWER when omitted', async () => {
    mocks.usersRepository.create.mockResolvedValue(buildUser());
    await mocks.service.create({ ...dto, role: undefined });

    expect(mocks.usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.VIEWER }),
    );
  });

  it('writes a CREATE audit log and emits USER_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'users',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.USER_CREATED,
      expect.objectContaining({ userId: 'uuid-001' }),
    );
  });

  it('does not leak the password hash into the audit payload', async () => {
    await mocks.service.create(dto, { userId: 'admin-1' });

    const auditArg = mocks.auditService.log.mock.calls[0][0];
    expect(JSON.stringify(auditArg)).not.toContain('$argon2id$hashed');
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('UsersService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.usersRepository.findById.mockResolvedValue(buildUser());
    mocks.usersRepository.update.mockResolvedValue(
      buildUser({ nom: 'Smith', role: UserRole.AUDITEUR, actif: false }),
    );
  });

  it('throws USER_NOT_FOUND when the user does not exist', async () => {
    mocks.usersRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { nom: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('forwards only the allowed mutable fields to the repository', async () => {
    await mocks.service.update('uuid-001', {
      nom: 'Smith',
      role: UserRole.AUDITEUR,
      actif: false,
    });

    expect(mocks.usersRepository.update).toHaveBeenCalledWith('uuid-001', {
      nom: 'Smith',
      prenom: undefined,
      telephone: undefined,
      role: UserRole.AUDITEUR,
      actif: false,
    });
  });

  it('writes an UPDATE audit log with avant/apres and emits USER_UPDATED', async () => {
    await mocks.service.update('uuid-001', { nom: 'Smith' }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'users',
        enregistrementId: 'uuid-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.USER_UPDATED, {
      userId: 'uuid-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('UsersService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.usersRepository.findById.mockResolvedValue(buildUser());
  });

  it('throws USER_NOT_FOUND when the user does not exist', async () => {
    mocks.usersRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.usersRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('uuid-001');

    expect(mocks.usersRepository.softDelete).toHaveBeenCalledWith('uuid-001');
  });

  it('writes a DELETE audit log and emits USER_DELETED', async () => {
    await mocks.service.remove('uuid-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'users' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.USER_DELETED, {
      userId: 'uuid-001',
    });
  });
});
