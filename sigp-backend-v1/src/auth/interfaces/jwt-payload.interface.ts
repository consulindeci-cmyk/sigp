import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // userId (UUID)
  email: string; // email utilisateur
  role: UserRole; // rôle système
  jti?: string; // identifiant unique du token — clé de blacklist Redis (Phase 1.4)
  iat?: number; // issued at  (positionné par jsonwebtoken)
  exp?: number; // expiration (positionné par jsonwebtoken)
}

/**
 * Payload du refresh token — séparé de JwtPayload.
 * family_id permet la détection de réutilisation (Blueprint V2).
 */
export interface RefreshTokenPayload {
  sub: string;
  family_id: string;
  iat?: number;
  exp?: number;
}
