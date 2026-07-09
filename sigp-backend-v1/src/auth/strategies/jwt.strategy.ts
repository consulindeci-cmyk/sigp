import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../interfaces/user-request.interface';
import { ErrorCode } from '@/shared/constants/error-codes.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const publicKeyPath = config.get<string>('JWT_PUBLIC_KEY_PATH', './keys/public.pem');

    if (!fs.existsSync(publicKeyPath)) {
      throw new Error(
        `[SIGP] FATAL: JWT RSA public key not found at "${publicKeyPath}".\n` +
          `  Run: npm run generate:keys`,
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: fs.readFileSync(publicKeyPath),
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS);
    }
    // jti + exp propagés pour la vérification de blacklist et le TTL au logout (Phase 1.4)
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
