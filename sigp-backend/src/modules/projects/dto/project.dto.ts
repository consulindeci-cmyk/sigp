import { IsDateString, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutProjet } from '@prisma/client';

export class CreateProjectDto {
  @ApiPropertyOptional({ example: 'P001' })
  @IsOptional()
  @IsString()
  code_projet?: string;

  @ApiProperty({ example: "Projet d'Accès à l'Eau Potable" })
  @IsString()
  @IsNotEmpty()
  nom_projet: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Banque Mondiale' })
  @IsString()
  @IsNotEmpty()
  bailleur_principal: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  date_debut: string;

  @ApiProperty({ example: '2027-12-31' })
  @IsDateString()
  date_fin: string;

  @ApiProperty({ example: '2500000.00' })
  @IsNotEmpty()
  budget_total: string;

  @ApiPropertyOptional({ example: 'XOF', default: 'XOF' })
  @IsOptional()
  @IsString()
  devise?: string;

  @ApiPropertyOptional({ enum: StatutProjet, default: StatutProjet.PREPARATION })
  @IsOptional()
  @IsEnum(StatutProjet)
  statut?: StatutProjet;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom_projet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bailleur_principal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_fin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  budget_total?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  devise?: string;

  @ApiPropertyOptional({ enum: StatutProjet })
  @IsOptional()
  @IsEnum(StatutProjet)
  statut?: StatutProjet;
}

export class QueryProjectsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: StatutProjet })
  @IsOptional()
  @IsEnum(StatutProjet)
  statut?: StatutProjet;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bailleur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  devise?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['createdAt', 'nom_projet', 'code_projet', 'date_debut', 'date_fin', 'budget_total', 'statut', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
