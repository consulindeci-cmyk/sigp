import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutRisque } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateRiskDto {
  @ApiProperty({ example: 'Technique' })
  @IsString()
  @IsNotEmpty()
  categorie: string;

  @ApiProperty({ example: 'Retard dans la livraison des équipements' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '1 = Faible, 2 = Moyen, 3 = Élevé', minimum: 1, maximum: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  probabilite: number;

  @ApiProperty({ description: '1 = Faible, 2 = Moyen, 3 = Élevé', minimum: 1, maximum: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  impact: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strategie_attenuation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsable?: string;

  @ApiPropertyOptional({ enum: StatutRisque, default: StatutRisque.IDENTIFIE })
  @IsOptional()
  @IsEnum(StatutRisque)
  statut?: StatutRisque;
}

export class UpdateRiskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categorie?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  probabilite?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  impact?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strategie_attenuation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsable?: string;

  @ApiPropertyOptional({ enum: StatutRisque })
  @IsOptional()
  @IsEnum(StatutRisque)
  statut?: StatutRisque;
}

export class QueryRisksDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categorie?: string;

  @ApiPropertyOptional({ description: 'Niveau: FAIBLE | MOYEN | ELEVE | CRITIQUE' })
  @IsOptional()
  @IsString()
  niveau_criticite?: string;

  @ApiPropertyOptional({ enum: StatutRisque })
  @IsOptional()
  @IsEnum(StatutRisque)
  statut?: StatutRisque;
}
