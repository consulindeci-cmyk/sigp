import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PtbaActivite, PtbaStatut } from '@prisma/client';

export class CriticalActivityResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty() nom: string;
  @ApiPropertyOptional() responsable: string | null;
  @ApiProperty({ enum: PtbaStatut }) statut: PtbaStatut;
  @ApiProperty() avancement: number;
  @ApiPropertyOptional() dateFinPrevue: string | null;
  @ApiProperty() joursRetard: number;

  static fromEntity(entity: PtbaActivite, now: Date): CriticalActivityResponseDto {
    const joursRetard = entity.date_fin_prevue
      ? Math.ceil((now.getTime() - entity.date_fin_prevue.getTime()) / 86400000)
      : 0;
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.libelle,
      responsable: entity.responsable_id ?? null,
      statut: entity.statut,
      avancement: Math.round(Number(entity.taux_realisation ?? 0)),
      dateFinPrevue: entity.date_fin_prevue?.toISOString() ?? null,
      joursRetard,
    };
  }
}
