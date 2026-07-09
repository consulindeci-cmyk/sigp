import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../interfaces/user-request.interface';
import { TokenBlacklistRepository } from '../token-blacklist.repository';
import { UnauthorizedException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenBlacklist: TokenBlacklistRepository,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    // 1. Validation Passport standard (signature RS256 + expiration)
    const activated = (await super.canActivate(context)) as boolean;
    if (!activated) return false;

    // 2. Vérification blacklist Redis : un JWT révoqué (logout) est refusé immédiatement
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const jti = request.user?.jti;

    if (jti && (await this.tokenBlacklist.isBlacklisted(jti))) {
      throw new UnauthorizedException(ErrorCode.TOKEN_BLACKLISTED, 'Token révoqué (déconnexion)');
    }

    return true;
  }
}
