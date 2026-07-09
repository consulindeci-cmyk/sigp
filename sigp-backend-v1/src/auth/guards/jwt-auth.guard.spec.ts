import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenBlacklistRepository } from '../token-blacklist.repository';
import { UnauthorizedException } from '@/common/exceptions/business.exception';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let tokenBlacklist: jest.Mocked<TokenBlacklistRepository>;

  beforeEach(() => {
    reflector = new Reflector();
    tokenBlacklist = {
      isBlacklisted: jest.fn().mockResolvedValue(false),
      blacklist: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TokenBlacklistRepository>;
    guard = new JwtAuthGuard(reflector, tokenBlacklist);
  });

  afterEach(() => jest.clearAllMocks());

  function createContext(user?: { jti?: string }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  /** Intercepte l'appel à AuthGuard('jwt').canActivate (validation Passport). */
  function mockPassport(result: boolean): jest.SpyInstance {
    const parentProto = Object.getPrototypeOf(JwtAuthGuard.prototype) as {
      canActivate: jest.Mock;
    };
    return jest.spyOn(parentProto, 'canActivate').mockResolvedValue(result);
  }

  it('returns true immediately for routes decorated with @Public()', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('reads the IS_PUBLIC_KEY metadata for every request', async () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    await guard.canActivate(createContext());

    expect(spy).toHaveBeenCalledWith(IS_PUBLIC_KEY, expect.any(Array));
  });

  it('delegates to Passport (super.canActivate) for non-public routes', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const superSpy = mockPassport(true);
    const ctx = createContext({ jti: 'jti-active' });

    await guard.canActivate(ctx);

    expect(superSpy).toHaveBeenCalledWith(ctx);
    superSpy.mockRestore();
  });

  it('checks the Redis blacklist for the jti of an authenticated request', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const superSpy = mockPassport(true);

    await guard.canActivate(createContext({ jti: 'jti-123' }));

    expect(tokenBlacklist.isBlacklisted).toHaveBeenCalledWith('jti-123');
    superSpy.mockRestore();
  });

  it('throws UnauthorizedException when the jti is blacklisted (logged out token)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const superSpy = mockPassport(true);
    tokenBlacklist.isBlacklisted.mockResolvedValue(true);

    await expect(guard.canActivate(createContext({ jti: 'jti-revoked' }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    superSpy.mockRestore();
  });

  it('allows the request when the jti is not blacklisted', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const superSpy = mockPassport(true);
    tokenBlacklist.isBlacklisted.mockResolvedValue(false);

    await expect(guard.canActivate(createContext({ jti: 'jti-ok' }))).resolves.toBe(true);
    superSpy.mockRestore();
  });

  it('does not query the blacklist when Passport rejects the token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const superSpy = mockPassport(false);

    await expect(guard.canActivate(createContext({ jti: 'jti-x' }))).resolves.toBe(false);
    expect(tokenBlacklist.isBlacklisted).not.toHaveBeenCalled();
    superSpy.mockRestore();
  });
});
