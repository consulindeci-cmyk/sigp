import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormatRapport, StatutRapport, TypeRapport } from '@prisma/client';

export class CreateReportDto {
  @ApiProperty({ description: 'ID du projet', format: 'uuid' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Code du rapport (ex: RPT-001)', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  codeRapport: string;

  @ApiProperty({ description: 'Titre du rapport', maxLength: 300 })
  @IsString()
  @MaxLength(300)
  titre: string;

  @ApiPropertyOptional({ description: 'Description détaillée' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TypeRapport, description: 'Type de rapport' })
  @IsEnum(TypeRapport)
  type: TypeRapport;

  @ApiProperty({ enum: FormatRapport, description: 'Format du fichier' })
  @IsEnum(FormatRapport)
  format: FormatRapport;

  @ApiPropertyOptional({ enum: StatutRapport, description: 'Statut initial' })
  @IsOptional()
  @IsEnum(StatutRapport)
  statut?: StatutRapport;

  @ApiProperty({ description: 'Période couverte (ex: T1 2026, Janvier 2026)', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  periode: string;

  @ApiProperty({ description: 'Date de génération (YYYY-MM-DD)', example: '2026-07-01' })
  @IsDateString()
  dateGeneration: string;

  @ApiPropertyOptional({ description: 'Date du dernier téléchargement (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTelechargement?: string;

  @ApiProperty({ description: 'Version du rapport (ex: 1.0)', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  version: string;

  @ApiProperty({ description: "Nom de l'auteur", maxLength: 200 })
  @IsString()
  @MaxLength(200)
  auteur: string;

  @ApiPropertyOptional({ description: 'Taille du fichier en Ko', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  tailleKo?: number;

  @ApiPropertyOptional({ description: 'Nombre de téléchargements', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  nbTelechargements?: number;

  @ApiPropertyOptional({ description: 'Commentaires libres' })
  @IsOptional()
  @IsString()
  commentaires?: string;
}
