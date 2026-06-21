import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Cherche le token dans le cookie httpOnly EN PREMIER, puis dans le header Authorization en fallback
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          if (request?.cookies?.['access_token']) {
            return request.cookies['access_token'];
          }
          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? 'default_secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.utilisateur.findFirst({
      where: { id: payload.sub, deletedAt: null, actif: true },
    });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable ou inactif');
    }
    return user;
  }
}
