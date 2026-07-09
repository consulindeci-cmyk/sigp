import { ApiProperty } from '@nestjs/swagger';
import { Unite } from '@prisma/client';

/**
 * Vue publique d'une unité.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class UniteResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  departementId: string;

  @ApiProperty({ example: 'UNI-RESEAU' })
  code: string;

  @ApiProperty({ example: 'Unité Réseau' })
  nom: string;

  @ApiProperty({ example: 'Unité en charge du réseau', nullable: true })
  description: string | null;

  @ApiProperty({ example: true })
  actif: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(unite: Unite): UniteResponseDto {
    return {
      id: unite.id,
      departementId: unite.departement_id,
      code: unite.code,
      nom: unite.nom,
      description: unite.description,
      actif: unite.actif,
      createdAt: unite.created_at,
      updatedAt: unite.updated_at,
    };
  }
}
