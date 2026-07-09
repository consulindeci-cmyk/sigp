import * as argon2 from 'argon2';
import { createHash } from 'crypto';
import { ForbiddenException, UnauthorizedException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, UserRole } from '@prisma/client';
import type { RefreshToken, User } from '@prisma/client';
import { AuthRepository, CONCURRENT_ROTATION_ERROR } from './auth.repository';
import { TokenBlacklistRepository } from './token-blacklist.repository';
import { AuthService } from './auth.service';
import { AuditService } from '@/audit/audit.service';
import type { AuthenticatedUser } from './interfaces/user-request.interface';

// argon2 n'est utilisé que pour la vérification du mot de passe (plus pour les tokens)
jest.mock('argon2', () => ({ verify: jest.fn() }));

// setImmediate synchrone pour que les effets de bord soient testables
beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Token opaque entièrement aléatoire — 128 caractères hex, familyId jamais exposé. */
const TEST_RAW_TOKEN = 'a'.repeat(128);
const TEST_SHA256 = createHash('sha256').update(TEST_RAW_TOKEN).digest('hex');
const TEST_FAMILY_ID = '123e4567-e89b-4d3c-a456-426614174000';

function buildActiveUser(overrides: Partial<User> = {}): User {
  return {
    id: 'uuid-001',
    nom: 'Doe',
    prenom: 'John',
    email: 'john@sigp.local',
    mot_de_passe: '$argon2id$hashed',
    role: UserRole.ADMIN,
    actif: true,
    langue_preference: 'fr',
    telephone: null,
    avatar_url: null,
    derniere_connexion: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    organisation_id: null,
    ...overrides,
  };
}

function buildRefreshToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return {
    id: 'rt-uuid-001',
    user_id: 'uuid-001',
    token_hash: TEST_SHA256,
    family_id: TEST_FAMILY_ID,
    expires_at: new Date(Date.now() + 604800_000),
    revoked_at: null,
    created_at: new Date(),
    ...overrides,
  };
}

// ─── Factory de mocks ─────────────────────────────────────────────────────────

function buildMocks() {
  const authRepository = {
    findByEmail: jest.fn(),
    findUserById: jest.fn(),
    updateLastLogin: jest.fn().mockResolvedValue(undefined),
    createRefreshToken: jest.fn().mockResolvedValue(buildRefreshToken()),
    findRefreshTokenByHash: jest.fn(),
    rotateInTransaction: jest.fn().mockResolvedValue(undefined),
    revokeFamily: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuthRepository>;

  const tokenBlacklist = {
    blacklist: jest.fn().mockResolvedValue(undefined),
    isBlacklisted: jest.fn().mockResolvedValue(false),
  } as unknown as jest.Mocked<TokenBlacklistRepository>;

  const jwtService = {
    sign: jest.fn().mockReturnValue('signed.jwt.token'),
  } as unknown as jest.Mocked<JwtService>;

  const configService = {
    get: jest.fn().mockReturnValue(900),
  } as unknown as jest.Mocked<ConfigService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = {
    emit: jest.fn(),
  } as unknown as jest.Mocked<EventEmitter2>;

  const service = new AuthService(
    authRepository,
    tokenBlacklist,
    jwtService,
    configService,
    auditService,
    eventEmitter,
  );

  return {
    service,
    authRepository,
    tokenBlacklist,
    jwtService,
    configService,
    auditService,
    eventEmitter,
  };
}

// ─── AuthService.login() ──────────────────────────────────────────────────────

describe('AuthService.login()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns accessToken, refreshToken (128 hex), tokenType and expiresIn', async () => {
    mocks.authRepository.findByEmail.mockResolvedValue(buildActiveUser());
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const result = await mocks.service.login({ email: 'john@sigp.local', password: 'secret' });

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBe(900);
    // Token entièrement opaque : 128 hex, aucun familyId exposé
    expect(result.refreshToken).toMatch(/^[0-9a-f]{128}$/i);
  });

  it('generates a JWT with the correct RS256 payload', async () => {
    const user = buildActiveUser();
    mocks.authRepository.findByEmail.mockResolvedValue(user);
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    await mocks.service.login({ email: user.email, password: 'secret' });

    expect(mocks.jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: user.id,
        email: user.email,
        role: user.role,
        jti: expect.any(String),
      }),
    );
  });

  it('stores the SHA-256 hash of the refresh token (not the raw token)', async () => {
    mocks.authRepository.findByEmail.mockResolvedValue(buildActiveUser());
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const result = await mocks.service.login({ email: 'john@sigp.local', password: 'secret' });

    // Le hash stocké doit être le SHA-256 du rawToken retourné
    const expectedHash = createHash('sha256').update(result.refreshToken).digest('hex');
    expect(mocks.authRepository.createRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: expectedHash }),
    );
  });

  it('throws INVALID_CREDENTIALS when email does not exist', async () => {
    mocks.authRepository.findByEmail.mockResolvedValue(null);
    await expect(
      mocks.service.login({ email: 'ghost@sigp.local', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws INVALID_CREDENTIALS when password is wrong', async () => {
    mocks.authRepository.findByEmail.mockResolvedValue(buildActiveUser());
    (argon2.verify as jest.Mock).mockResolvedValue(false);
    await expect(
      mocks.service.login({ email: 'john@sigp.local', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws ACCOUNT_DISABLED when user is inactive', async () => {
    mocks.authRepository.findByEmail.mockResolvedValue(buildActiveUser({ actif: false }));
    await expect(
      mocks.service.login({ email: 'john@sigp.local', password: 'secret' }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.ACCOUNT_DISABLED });
  });

  it('treats soft-deleted users as non-existent', async () => {
    mocks.authRepository.findByEmail.mockResolvedValue(null);
    await expect(
      mocks.service.login({ email: 'deleted@sigp.local', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('writes an audit log with AuditAction.LOGIN', async () => {
    const user = buildActiveUser();
    mocks.authRepository.findByEmail.mockResolvedValue(user);
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    await mocks.service.login({ email: user.email, password: 'secret' }, '127.0.0.1', 'Jest/1.0');

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        action: AuditAction.LOGIN,
        ipAddress: '127.0.0.1',
      }),
    );
  });

  it('emits USER_LOGGED_IN after successful login', async () => {
    const user = buildActiveUser();
    mocks.authRepository.findByEmail.mockResolvedValue(user);
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    await mocks.service.login({ email: user.email, password: 'secret' });

    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.USER_LOGGED_IN, {
      userId: user.id,
      email: user.email,
    });
  });

  it('does not emit any event when authentication fails', async () => {
    mocks.authRepository.findByEmail.mockResolvedValue(null);
    await expect(mocks.service.login({ email: 'x@y.com', password: 'x' })).rejects.toThrow();
    expect(mocks.eventEmitter.emit).not.toHaveBeenCalled();
  });
});

// ─── AuthService.refresh() ────────────────────────────────────────────────────

describe('AuthService.refresh()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const activeDbToken = buildRefreshToken();
  const user = buildActiveUser();

  beforeEach(() => {
    mocks = buildMocks();
    mocks.authRepository.findRefreshTokenByHash.mockResolvedValue(activeDbToken);
    mocks.authRepository.findUserById.mockResolvedValue(user);
    // configService retourne 900 pour ACCESS_TTL et 604800 pour REFRESH_TTL
    mocks.configService.get.mockImplementation((key: string, def: unknown) => {
      if (key === 'JWT_REFRESH_TOKEN_TTL') return 604800;
      return def ?? 900;
    });
  });

  // ─── Happy path ──────────────────────────────────────────────────────────────

  it('returns new accessToken and refreshToken (128 hex) on successful refresh', async () => {
    const result = await mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN });

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBe(900);
    expect(result.refreshToken).toMatch(/^[0-9a-f]{128}$/i);
  });

  it('looks up token by SHA-256 hash of the received raw token', async () => {
    await mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN });

    expect(mocks.authRepository.findRefreshTokenByHash).toHaveBeenCalledWith(TEST_SHA256);
  });

  it('calls rotateInTransaction with same familyId (rotation preserves family)', async () => {
    await mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN });

    expect(mocks.authRepository.rotateInTransaction).toHaveBeenCalledWith(
      activeDbToken.id,
      expect.objectContaining({ familyId: TEST_FAMILY_ID }),
    );
  });

  it('stores the SHA-256 hash of the new raw token in the transaction', async () => {
    const result = await mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN });
    const expectedNewHash = createHash('sha256').update(result.refreshToken).digest('hex');

    expect(mocks.authRepository.rotateInTransaction).toHaveBeenCalledWith(
      activeDbToken.id,
      expect.objectContaining({ tokenHash: expectedNewHash }),
    );
  });

  it('generates new JWT with correct payload', async () => {
    await mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN });

    expect(mocks.jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: user.id,
        email: user.email,
        role: user.role,
        jti: expect.any(String),
      }),
    );
  });

  it('emits AUTH_REFRESH_SUCCESS after rotation', async () => {
    await mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN });

    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.AUTH_REFRESH_SUCCESS, {
      userId: user.id,
      familyId: TEST_FAMILY_ID,
    });
  });

  it('writes an audit log after successful refresh', async () => {
    await mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        action: AuditAction.UPDATE,
        tableCible: 'refresh_tokens',
      }),
    );
  });

  // ─── Échecs ──────────────────────────────────────────────────────────────────

  it('throws REFRESH_TOKEN_EXPIRED when token hash is not found in DB', async () => {
    mocks.authRepository.findRefreshTokenByHash.mockResolvedValue(null);

    await expect(mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN })).rejects.toMatchObject({
      errorCode: ErrorCode.REFRESH_TOKEN_EXPIRED,
    });
  });

  it('throws REFRESH_TOKEN_EXPIRED when token is naturally expired', async () => {
    const expiredToken = buildRefreshToken({
      expires_at: new Date(Date.now() - 1000),
      revoked_at: null,
    });
    mocks.authRepository.findRefreshTokenByHash.mockResolvedValue(expiredToken);

    await expect(mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN })).rejects.toMatchObject({
      errorCode: ErrorCode.REFRESH_TOKEN_EXPIRED,
    });
  });

  it('throws ACCOUNT_DISABLED when user is inactive', async () => {
    mocks.authRepository.findUserById.mockResolvedValue(buildActiveUser({ actif: false }));

    await expect(mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws REFRESH_TOKEN_EXPIRED on concurrent rotation (token already rotated)', async () => {
    mocks.authRepository.rotateInTransaction.mockRejectedValue(
      new Error(CONCURRENT_ROTATION_ERROR),
    );

    await expect(mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN })).rejects.toMatchObject({
      errorCode: ErrorCode.REFRESH_TOKEN_EXPIRED,
    });
  });

  // ─── Reuse Detection ─────────────────────────────────────────────────────────

  it('throws REFRESH_TOKEN_REUSE_DETECTED when token is already revoked', async () => {
    const revokedToken = buildRefreshToken({ revoked_at: new Date() });
    mocks.authRepository.findRefreshTokenByHash.mockResolvedValue(revokedToken);

    await expect(mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN })).rejects.toMatchObject({
      errorCode: ErrorCode.REFRESH_TOKEN_REUSE_DETECTED,
    });
  });

  it('revokes the entire token family on reuse detection', async () => {
    const revokedToken = buildRefreshToken({ revoked_at: new Date() });
    mocks.authRepository.findRefreshTokenByHash.mockResolvedValue(revokedToken);

    await expect(mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN })).rejects.toThrow();
    expect(mocks.authRepository.revokeFamily).toHaveBeenCalledWith(TEST_FAMILY_ID);
  });

  it('emits AUTH_REFRESH_REUSED and AUTH_TOKEN_FAMILY_REVOKED on reuse detection', async () => {
    const revokedToken = buildRefreshToken({ revoked_at: new Date() });
    mocks.authRepository.findRefreshTokenByHash.mockResolvedValue(revokedToken);

    await expect(mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN })).rejects.toThrow();

    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.AUTH_REFRESH_REUSED,
      expect.objectContaining({ familyId: TEST_FAMILY_ID }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.AUTH_TOKEN_FAMILY_REVOKED,
      expect.objectContaining({ familyId: TEST_FAMILY_ID, reason: 'reuse' }),
    );
  });

  it('writes a reuse audit log on reuse detection', async () => {
    const revokedToken = buildRefreshToken({ revoked_at: new Date() });
    mocks.authRepository.findRefreshTokenByHash.mockResolvedValue(revokedToken);

    await expect(mocks.service.refresh({ refreshToken: TEST_RAW_TOKEN })).rejects.toThrow();

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'refresh_tokens' }),
    );
  });
});

// ─── AuthService.logout() ─────────────────────────────────────────────────────

describe('AuthService.logout()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  /** Access token courant authentifié : jti + exp portés par le JWT. */
  const JTI = 'jti-logout-001';
  function buildLoggedUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
    return {
      id: 'uuid-001',
      email: 'john@sigp.local',
      role: UserRole.ADMIN,
      jti: JTI,
      exp: Math.floor(Date.now() / 1000) + 900,
      ...overrides,
    };
  }

  beforeEach(() => {
    mocks = buildMocks();
    mocks.authRepository.findRefreshTokenByHash.mockResolvedValue(buildRefreshToken());
  });

  it('revokes the entire Token Family of the current refresh token', async () => {
    await mocks.service.logout(buildLoggedUser(), { refreshToken: TEST_RAW_TOKEN });

    expect(mocks.authRepository.revokeFamily).toHaveBeenCalledWith(TEST_FAMILY_ID);
  });

  it('blacklists the current access token with a TTL equal to its remaining lifetime', async () => {
    await mocks.service.logout(buildLoggedUser(), { refreshToken: TEST_RAW_TOKEN });

    expect(mocks.tokenBlacklist.blacklist).toHaveBeenCalledWith(JTI, expect.any(Number));

    // TTL dynamique ≈ exp - now (jamais une durée fixe)
    const ttlArg = mocks.tokenBlacklist.blacklist.mock.calls[0][1] as number;
    expect(ttlArg).toBeGreaterThanOrEqual(899);
    expect(ttlArg).toBeLessThanOrEqual(900);
  });

  it('emits AUTH_LOGOUT_SUCCESS, AUTH_REFRESH_REVOKED and AUTH_JWT_BLACKLISTED', async () => {
    await mocks.service.logout(buildLoggedUser(), { refreshToken: TEST_RAW_TOKEN });

    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.AUTH_LOGOUT_SUCCESS, {
      userId: 'uuid-001',
    });
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.AUTH_REFRESH_REVOKED,
      expect.objectContaining({ userId: 'uuid-001', familyId: TEST_FAMILY_ID }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.AUTH_JWT_BLACKLISTED,
      expect.objectContaining({ userId: 'uuid-001', jti: JTI }),
    );
  });

  it('writes audit logs for logout, family revocation and jwt blacklist (non-blocking)', async () => {
    await mocks.service.logout(buildLoggedUser(), { refreshToken: TEST_RAW_TOKEN });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.LOGOUT, tableCible: 'users' }),
    );
    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'refresh_tokens' }),
    );
    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.UPDATE, tableCible: 'jwt_blacklist' }),
    );
  });

  it('still blacklists the access token when the refresh token is not found', async () => {
    mocks.authRepository.findRefreshTokenByHash.mockResolvedValue(null);

    await mocks.service.logout(buildLoggedUser(), { refreshToken: TEST_RAW_TOKEN });

    expect(mocks.authRepository.revokeFamily).not.toHaveBeenCalled();
    expect(mocks.tokenBlacklist.blacklist).toHaveBeenCalledWith(JTI, expect.any(Number));
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.AUTH_LOGOUT_SUCCESS, {
      userId: 'uuid-001',
    });
  });

  it('does not blacklist when the access token carries no jti/exp', async () => {
    await mocks.service.logout(buildLoggedUser({ jti: undefined, exp: undefined }), {
      refreshToken: TEST_RAW_TOKEN,
    });

    expect(mocks.tokenBlacklist.blacklist).not.toHaveBeenCalled();
    // La révocation de famille et le logout restent effectués
    expect(mocks.authRepository.revokeFamily).toHaveBeenCalledWith(TEST_FAMILY_ID);
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.AUTH_LOGOUT_SUCCESS, {
      userId: 'uuid-001',
    });
  });
});
