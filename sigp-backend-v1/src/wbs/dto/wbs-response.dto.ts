import { ApiProperty } from '@nestjs/swagger';
import { WbsNode, WbsNodeType } from '@prisma/client';

/**
 * Vue publique d'un nœud WBS.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class WbsResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  projectId: string;

  @ApiProperty({ example: 'b2c3d4e5-0000-0000-0000-ef1234567890', nullable: true })
  parentId: string | null;

  @ApiProperty({ example: 'c3d4e5f6-0000-0000-0000-ef1234567890', nullable: true })
  objectiveId: string | null;

  @ApiProperty({ example: 'WBS-1.1' })
  code: string;

  @ApiProperty({ example: 'Phase de préparation' })
  libelle: string;

  @ApiProperty({ enum: WbsNodeType, example: WbsNodeType.PHASE })
  type: WbsNodeType;

  @ApiProperty({ example: 0 })
  ordre: number;

  @ApiProperty({ example: 1 })
  niveau: number;

  @ApiProperty({ example: 'd4e5f6a7-0000-0000-0000-ef1234567890', nullable: true })
  responsableId: string | null;

  @ApiProperty({ example: true })
  actif: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', nullable: true })
  dateDebut: Date | null;

  @ApiProperty({ example: '2026-03-31T00:00:00.000Z', nullable: true })
  dateFin: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(node: WbsNode): WbsResponseDto {
    return {
      id: node.id,
      projectId: node.project_id,
      parentId: node.parent_id,
      objectiveId: node.objective_id,
      code: node.code,
      libelle: node.libelle,
      type: node.type,
      ordre: node.ordre,
      niveau: node.niveau,
      responsableId: node.responsable_id,
      actif: node.actif,
      dateDebut: node.date_debut,
      dateFin: node.date_fin,
      createdAt: node.created_at,
      updatedAt: node.updated_at,
    };
  }
}
