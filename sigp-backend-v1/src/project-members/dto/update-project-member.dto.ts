import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { RoleMembreProjet } from '@prisma/client';

/**
 * Champs modifiables uniquement : role, actif.
 * `projectId` et `userId` sont immuables (ils identifient l'appartenance).
 */
export class UpdateProjectMemberDto {
  @ApiPropertyOptional({ enum: RoleMembreProjet })
  @IsOptional()
  @IsEnum(RoleMembreProjet, { message: 'Le rôle du membre est invalide' })
  role?: RoleMembreProjet;

  @ApiPropertyOptional({ description: 'Statut actif/inactif du membre' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
