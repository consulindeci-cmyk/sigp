import { ApiProperty } from '@nestjs/swagger';
import { Programme, ProgrammeStatus } from '@prisma/client';

/**
 * Vue publique d'un programme.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class ProgrammeResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  uniteId: string;

  @ApiProperty({ example: 'PRG-SANTE' })
  code: string;

  @ApiProperty({ example: 'Programme Santé Rurale' })
  nom: string;

  @ApiProperty({ example: 'Programme d’amélioration de la santé', nullable: true })
  description: string | null;

  @ApiProperty({ enum: ProgrammeStatus, example: ProgrammeStatus.EN_PREPARATION })
  statut: ProgrammeStatus;

  @ApiProperty({ example: true })
  actif: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(prog: Programme): ProgrammeResponseDto {
    return {
      id: prog.id,
      uniteId: prog.unite_id,
      code: prog.code,
      nom: prog.nom,
      description: prog.description,
      statut: prog.statut,
      actif: prog.actif,
      createdAt: prog.created_at,
      updatedAt: prog.updated_at,
    };
  }
}
