import { ApiProperty } from '@nestjs/swagger';
import { PtbaActivite, PtbaStatut } from '@prisma/client';

/**
 * Vue publique d'une activité PTBA.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class PtbaResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  projectId: string;

  @ApiProperty({ example: 'b2c3d4e5-0000-0000-0000-ef1234567890', nullable: true })
  wbsId: string | null;

  @ApiProperty({ example: 'c3d4e5f6-0000-0000-0000-ef1234567890', nullable: true })
  logframeIndicatorId: string | null;

  @ApiProperty({ example: 'ACT-2026-01' })
  code: string;

  @ApiProperty({ example: 'Formation des agents de santé' })
  libelle: string;

  @ApiProperty({ example: 'Sessions de formation trimestrielles', nullable: true })
  description: string | null;

  @ApiProperty({ enum: PtbaStatut, example: PtbaStatut.NON_DEMARRE })
  statut: PtbaStatut;

  @ApiProperty({ example: 2026 })
  annee: number;

  @ApiProperty({ example: 1 })
  trimestre: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', nullable: true })
  dateDebutPrevue: Date | null;

  @ApiProperty({ example: '2026-03-31T00:00:00.000Z', nullable: true })
  dateFinPrevue: Date | null;

  @ApiProperty({ example: null, nullable: true })
  dateDebutReelle: Date | null;

  @ApiProperty({ example: null, nullable: true })
  dateFinReelle: Date | null;

  @ApiProperty({ example: 5000000, nullable: true })
  montantPrevu: number | null;

  @ApiProperty({ example: 3200000, nullable: true })
  montantRealise: number | null;

  @ApiProperty({ example: 64, nullable: true })
  tauxRealisation: number | null;

  @ApiProperty({ example: 'd4e5f6a7-0000-0000-0000-ef1234567890', nullable: true })
  responsableId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(activite: PtbaActivite): PtbaResponseDto {
    return {
      id: activite.id,
      projectId: activite.project_id,
      wbsId: activite.wbs_id,
      logframeIndicatorId: activite.logframe_ref_id,
      code: activite.code,
      libelle: activite.libelle,
      description: activite.description,
      statut: activite.statut,
      annee: activite.annee,
      trimestre: activite.trimestre,
      dateDebutPrevue: activite.date_debut_prevue,
      dateFinPrevue: activite.date_fin_prevue,
      dateDebutReelle: activite.date_debut_reelle,
      dateFinReelle: activite.date_fin_reelle,
      montantPrevu: activite.montant_prevu === null ? null : Number(activite.montant_prevu),
      montantRealise: activite.montant_realise === null ? null : Number(activite.montant_realise),
      tauxRealisation:
        activite.taux_realisation === null ? null : Number(activite.taux_realisation),
      responsableId: activite.responsable_id,
      createdAt: activite.created_at,
      updatedAt: activite.updated_at,
    };
  }
}
