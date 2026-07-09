import { ApiProperty } from '@nestjs/swagger';
import { ProjectMember, RoleMembreProjet } from '@prisma/client';

/**
 * Vue publique d'un membre de projet.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class ProjectMemberResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  projectId: string;

  @ApiProperty({ example: 'b2c3d4e5-0000-0000-0000-ef1234567890' })
  userId: string;

  @ApiProperty({ enum: RoleMembreProjet, example: RoleMembreProjet.MEMBRE })
  role: RoleMembreProjet;

  @ApiProperty({ example: true })
  actif: boolean;

  @ApiProperty({ example: null, nullable: true })
  dateDebut: Date | null;

  @ApiProperty({ example: null, nullable: true })
  dateFin: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(member: ProjectMember): ProjectMemberResponseDto {
    return {
      id: member.id,
      projectId: member.project_id,
      userId: member.user_id,
      role: member.role_projet,
      actif: member.actif,
      dateDebut: member.date_debut,
      dateFin: member.date_fin,
      createdAt: member.created_at,
      updatedAt: member.updated_at,
    };
  }
}
