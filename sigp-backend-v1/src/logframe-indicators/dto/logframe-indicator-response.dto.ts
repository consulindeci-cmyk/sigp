import { ApiProperty } from '@nestjs/swagger';
import { IndicatorType, LogframeIndicator } from '@prisma/client';

/**
 * Vue publique d'un indicateur du cadre logique.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class LogframeIndicatorResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  objectiveId: string;

  @ApiProperty({ example: 'IND-1' })
  code: string;

  @ApiProperty({ example: 'Taux de couverture vaccinale' })
  libelle: string;

  @ApiProperty({ enum: IndicatorType, example: IndicatorType.OUTPUT })
  type: IndicatorType;

  @ApiProperty({ example: '%', nullable: true })
  unite: string | null;

  @ApiProperty({ example: 45.5, nullable: true })
  valeurBaseline: number | null;

  @ApiProperty({ example: 90, nullable: true })
  valeurCible: number | null;

  @ApiProperty({ example: 62.3, nullable: true })
  valeurActuelle: number | null;

  @ApiProperty({ example: 'Rapports du ministère de la santé', nullable: true })
  sourceVerification: string | null;

  @ApiProperty({ example: 'Trimestrielle', nullable: true })
  periodicite: string | null;

  @ApiProperty({ example: true })
  actif: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(indicator: LogframeIndicator): LogframeIndicatorResponseDto {
    return {
      id: indicator.id,
      objectiveId: indicator.objective_id,
      code: indicator.code,
      libelle: indicator.libelle,
      type: indicator.type,
      unite: indicator.unite,
      valeurBaseline: indicator.valeur_baseline === null ? null : Number(indicator.valeur_baseline),
      valeurCible: indicator.valeur_cible === null ? null : Number(indicator.valeur_cible),
      valeurActuelle: indicator.valeur_actuelle === null ? null : Number(indicator.valeur_actuelle),
      sourceVerification: indicator.source_verification,
      periodicite: indicator.periodicite,
      actif: indicator.actif,
      createdAt: indicator.created_at,
      updatedAt: indicator.updated_at,
    };
  }
}
