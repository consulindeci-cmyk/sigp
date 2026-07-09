import { ApiProperty } from '@nestjs/swagger';
import { Departement } from '@prisma/client';

/**
 * Vue publique d'un département.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class DepartementResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  directionId: string;

  @ApiProperty({ example: 'DEP-SI' })
  code: string;

  @ApiProperty({ example: 'Département Systèmes d’Information' })
  nom: string;

  @ApiProperty({ example: 'Département en charge de l’infrastructure', nullable: true })
  description: string | null;

  @ApiProperty({ example: true })
  actif: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(dep: Departement): DepartementResponseDto {
    return {
      id: dep.id,
      directionId: dep.direction_id,
      code: dep.code,
      nom: dep.nom,
      description: dep.description,
      actif: dep.actif,
      createdAt: dep.created_at,
      updatedAt: dep.updated_at,
    };
  }
}
