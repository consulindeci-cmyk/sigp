import { ApiProperty } from '@nestjs/swagger';
import { Gouvernance } from '@prisma/client';

/**
 * Vue publique d'une entrée de gouvernance.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class GouvernanceResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  projectId: string;

  @ApiProperty({ example: 'Awa Koné' })
  nom: string;

  @ApiProperty({ example: 'Président du comité de pilotage' })
  role: string;

  @ApiProperty({ example: 'Ministère de la Santé', nullable: true })
  organisation: string | null;

  @ApiProperty({ example: 'awa.kone@sante.gouv', nullable: true })
  email: string | null;

  @ApiProperty({ example: '+2250102030405', nullable: true })
  telephone: string | null;

  @ApiProperty({ example: 'b2c3d4e5-0000-0000-0000-ef1234567890', nullable: true })
  userId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(gouvernance: Gouvernance): GouvernanceResponseDto {
    return {
      id: gouvernance.id,
      projectId: gouvernance.project_id,
      nom: gouvernance.nom,
      role: gouvernance.role,
      organisation: gouvernance.organisation,
      email: gouvernance.email,
      telephone: gouvernance.telephone,
      userId: gouvernance.user_id,
      createdAt: gouvernance.created_at,
      updatedAt: gouvernance.updated_at,
    };
  }
}
