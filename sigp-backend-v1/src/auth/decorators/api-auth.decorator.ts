import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

/**
 * Décorateur composite pour protéger un endpoint avec JWT + RBAC.
 *
 * Usage :
 *   @ApiAuth()                             — authentifié, tous rôles
 *   @ApiAuth(UserRole.ADMIN)               — ADMIN uniquement
 *   @ApiAuth(UserRole.ADMIN, UserRole.COORDINATEUR) — plusieurs rôles
 */
export function ApiAuth(...roles: UserRole[]) {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiUnauthorizedResponse({ description: 'Token JWT absent, invalide ou expiré' }),
    ApiForbiddenResponse({ description: 'Permissions insuffisantes pour cette ressource' }),
    ...(roles.length > 0 ? [Roles(...roles)] : []),
  );
}
