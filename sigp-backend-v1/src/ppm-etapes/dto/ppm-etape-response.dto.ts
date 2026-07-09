import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PpmEtape } from '@prisma/client';

export class PpmEtapeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() marcheId: string;
  @ApiProperty() libelle: string;
  @ApiProperty() ordre: number;
  @ApiPropertyOptional() datePrevue: Date | null;
  @ApiPropertyOptional() dateReelle: Date | null;
  @ApiProperty() complete: boolean;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(entity: PpmEtape): PpmEtapeResponseDto {
    return {
      id: entity.id,
      marcheId: entity.marche_id,
      libelle: entity.libelle,
      ordre: entity.ordre,
      datePrevue: entity.date_prevue ?? null,
      dateReelle: entity.date_reelle ?? null,
      complete: entity.complete,
      notes: entity.notes ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
