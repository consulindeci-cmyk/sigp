import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FormatRapport, StatutRapport, TypeRapport } from '@prisma/client';

export class UpdateReportDto {
  @ApiPropertyOptional({ description: 'Code du rapport', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codeRapport?: string;

  @ApiPropertyOptional({ description: 'Titre du rapport', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  titre?: string;

  @ApiPropertyOptional({ description: 'Description détaillée' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TypeRapport, description: 'Type de rapport' })
  @IsOptional()
  @IsEnum(TypeRapport)
  type?: TypeRapport;

  @ApiPropertyOptional({ enum: FormatRapport, description: 'Format du fichier' })
  @IsOptional()
  @IsEnum(FormatRapport)
  format?: FormatRapport;

  @ApiPropertyOptional({ enum: StatutRapport, description: 'Statut' })
  @IsOptional()
  @IsEnum(StatutRapport)
  statut?: StatutRapport;

  @ApiPropertyOptional({ description: 'Période couverte', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  periode?: string;

  @ApiPropertyOptional({ description: 'Date de génération (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateGeneration?: string;

  @ApiPropertyOptional({ description: 'Date du dernier téléchargement (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTelechargement?: string;

  @ApiPropertyOptional({ description: 'Version du rapport', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @ApiPropertyOptional({ description: "Nom de l'auteur", maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  auteur?: string;

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
