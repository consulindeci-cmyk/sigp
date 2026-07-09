import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  afterEach(() => jest.clearAllMocks());

  function createContext(userRole: UserRole | null, requiredRoles?: UserRole[]): ExecutionContext {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles ?? undefined);

    const request =
      userRole !== null ? { user: { id: 'uuid', email: 'test@sigp.local', role: userRole } } : {};

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('grants access when no roles are required', () => {
    expect(guard.canActivate(createContext(UserRole.VIEWER))).toBe(true);
  });

  it('grants access when user role matches exactly', () => {
    expect(guard.canActivate(createContext(UserRole.ADMIN, [UserRole.ADMIN]))).toBe(true);
  });

  it('grants access when user role is one of several required roles', () => {
    expect(
      guard.canActivate(
        createContext(UserRole.COORDINATEUR, [UserRole.ADMIN, UserRole.COORDINATEUR]),
      ),
    ).toBe(true);
  });

  it('throws when user role is not in the required list', () => {
    expect(() => guard.canActivate(createContext(UserRole.VIEWER, [UserRole.ADMIN]))).toThrow();
  });

  it('throws when request has no authenticated user', () => {
    expect(() => guard.canActivate(createContext(null, [UserRole.ADMIN]))).toThrow();
  });

  it.each([
    [UserRole.ADMIN, [UserRole.ADMIN]],
    [UserRole.COORDINATEUR, [UserRole.COORDINATEUR]],
    [UserRole.CHARGE_PROGRAMME, [UserRole.CHARGE_PROGRAMME]],
    [UserRole.FINANCIER, [UserRole.FINANCIER]],
    [UserRole.AUDITEUR, [UserRole.AUDITEUR]],
    [UserRole.VIEWER, [UserRole.VIEWER]],
  ])('grants access to role %s for its own permission level', (role, required) => {
    expect(guard.canActivate(createContext(role, required))).toBe(true);
  });
});
