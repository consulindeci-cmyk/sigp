import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../interfaces/user-request.interface';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { ForbiddenException } from '@/common/exceptions/business.exception';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Les ADMIN ont accès à tout
    if (user && user.role === UserRole.ADMIN) {
      return true;
    }

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        `Accès refusé. Rôles requis : ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
