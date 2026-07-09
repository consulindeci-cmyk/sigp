import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormatRapport, RapportProjet, StatutRapport, TypeRapport } from '@prisma/client';

export class ReportResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiProperty() codeRapport: string;
  @ApiProperty() titre: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty({ enum: TypeRapport }) type: TypeRapport;
  @ApiProperty({ enum: FormatRapport }) format: FormatRapport;
  @ApiProperty({ enum: StatutRapport }) statut: StatutRapport;
  @ApiProperty() periode: string;
  @ApiProperty() dateGeneration: Date;
  @ApiPropertyOptional() dateTelechargement: Date | null;
  @ApiProperty() version: string;
  @ApiProperty() auteur: string;
  @ApiProperty() tailleKo: number;
  @ApiProperty() nbTelechargements: number;
  @ApiPropertyOptional() commentaires: string | null;
  @ApiPropertyOptional() createdBy: string | null;
  @ApiPropertyOptional() updatedBy: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(entity: RapportProjet): ReportResponseDto {
    return {
      id: entity.id,
      projectId: entity.project_id,
      codeRapport: entity.code_rapport,
      titre: entity.titre,
      description: entity.description ?? null,
      type: entity.type,
      format: entity.format,
      statut: entity.statut,
      periode: entity.periode,
      dateGeneration: entity.date_generation,
      dateTelechargement: entity.date_telechargement ?? null,
      version: entity.version,
      auteur: entity.auteur,
      tailleKo: entity.taille_ko,
      nbTelechargements: entity.nb_telechargements,
      commentaires: entity.commentaires ?? null,
      createdBy: entity.created_by ?? null,
      updatedBy: entity.updated_by ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
