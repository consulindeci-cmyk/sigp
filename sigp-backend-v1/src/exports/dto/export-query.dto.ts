import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ExportResource {
  PROJECTS = 'projects',
  PTBA = 'ptba',
  BUDGET_LINES = 'budget-lines',
  BUDGET_VERSIONS = 'budget-versions',
  JOURNAL = 'journal',
  FUNDING_SOURCES = 'funding-sources',
  DISBURSEMENTS = 'disbursements',
  CONTRACTS = 'contracts',
  PPM = 'ppm',
  PPM_ETAPES = 'ppm-etapes',
  RISQUES = 'risques',
  LIVRABLES = 'livrables',
  DOCUMENTS = 'documents',
  REPORTS = 'reports',
  NOTIFICATIONS = 'notifications',
}

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

export class ExportQueryDto {
  @ApiProperty({ enum: ExportResource, description: 'Ressource à exporter' })
  @IsEnum(ExportResource, { message: 'La ressource est invalide' })
  resource: ExportResource;

  @ApiProperty({ enum: ExportFormat, description: 'Format du fichier exporté' })
  @IsEnum(ExportFormat, { message: 'Le format est invalide' })
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Filtrer par projet', format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId?: string;

  @ApiPropertyOptional({ description: 'Recherche textuelle' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de début est invalide' })
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de fin est invalide' })
  dateTo?: string;
}
