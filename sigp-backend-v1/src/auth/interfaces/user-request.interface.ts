import { UserRole } from '@prisma/client';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  jti?: string; // identifiant unique du JWT courant (blacklist Redis)
  exp?: number; // expiration Unix (secondes) — sert au TTL de blacklist au logout
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
