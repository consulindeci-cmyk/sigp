import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RoleMembreProjet } from '@prisma/client';

export class CreateProjectMemberDto {
  @ApiProperty({
    example: 'a1b2c3d4-0000-0000-0000-ef1234567890',
    description: 'Identifiant du projet (obligatoire)',
  })
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId: string;

  @ApiProperty({
    example: 'b2c3d4e5-0000-0000-0000-ef1234567890',
    description: "Identifiant de l'utilisateur (obligatoire)",
  })
  @IsUUID('4', { message: "L'identifiant de l'utilisateur est invalide" })
  userId: string;

  @ApiPropertyOptional({ enum: RoleMembreProjet, default: RoleMembreProjet.MEMBRE })
  @IsOptional()
  @IsEnum(RoleMembreProjet, { message: 'Le rôle du membre est invalide' })
  role?: RoleMembreProjet;
}
