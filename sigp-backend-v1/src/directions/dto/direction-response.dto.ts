import { ApiProperty } from '@nestjs/swagger';
import { Direction } from '@prisma/client';

/**
 * Vue publique d'une direction.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class DirectionResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  organisationId: string;

  @ApiProperty({ example: 'DIR-TECH' })
  code: string;

  @ApiProperty({ example: 'Direction Technique' })
  nom: string;

  @ApiProperty({ example: 'Direction en charge des systèmes', nullable: true })
  description: string | null;

  @ApiProperty({ example: true })
  actif: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(dir: Direction): DirectionResponseDto {
    return {
      id: dir.id,
      organisationId: dir.organisation_id,
      code: dir.code,
      nom: dir.nom,
      description: dir.description,
      actif: dir.actif,
      createdAt: dir.created_at,
      updatedAt: dir.updated_at,
    };
  }
}
