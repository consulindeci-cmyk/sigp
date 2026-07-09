import { ApiProperty } from '@nestjs/swagger';
import { LogframeLevel, LogframeObjective } from '@prisma/client';

/**
 * Vue publique d'un objectif du cadre logique.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class LogframeObjectiveResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  projectId: string;

  @ApiProperty({ enum: LogframeLevel, example: LogframeLevel.OBJECTIF_GLOBAL })
  niveau: LogframeLevel;

  @ApiProperty({ example: 'OG-1' })
  code: string;

  @ApiProperty({ example: 'Améliorer l’accès aux soins en milieu rural' })
  libelle: string;

  @ApiProperty({ example: 'Description détaillée', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'b2c3d4e5-0000-0000-0000-ef1234567890', nullable: true })
  parentId: string | null;

  @ApiProperty({ example: 0 })
  ordre: number;

  @ApiProperty({ example: true })
  actif: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(objective: LogframeObjective): LogframeObjectiveResponseDto {
    return {
      id: objective.id,
      projectId: objective.project_id,
      niveau: objective.niveau,
      code: objective.code,
      libelle: objective.libelle,
      description: objective.description,
      parentId: objective.parent_id,
      ordre: objective.ordre,
      actif: objective.actif,
      createdAt: objective.created_at,
      updatedAt: objective.updated_at,
    };
  }
}
