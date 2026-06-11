import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutPTBA } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePtbaDto {
  @ApiProperty({ example: 'ACT-001' })
  @IsString()
  @IsNotEmpty()
  code_activite: string;

  @ApiProperty({ example: 'Infrastructures' })
  @IsString()
  @IsNotEmpty()
  composante: string;

  @ApiProperty({ example: 'Construction de forages' })
  @IsString()
  @IsNotEmpty()
  activite: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsable?: string;

  @ApiProperty({ example: '500000.00' })
  @IsNotEmpty()
  budget_prevu: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  q1?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  q2?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  q3?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  q4?: number;

  @ApiPropertyOptional({ enum: StatutPTBA, default: StatutPTBA.PLANIFIE })
  @IsOptional()
  @IsEnum(StatutPTBA)
  statut?: StatutPTBA;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  pourcentage_avancement?: number;
}

export class UpdatePtbaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  composante?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activite?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsable?: string;

  @ApiPropertyOptional()
  @IsOptional()
  budget_prevu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  q1?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  q2?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  q3?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  q4?: number;

  @ApiPropertyOptional({ enum: StatutPTBA })
  @IsOptional()
  @IsEnum(StatutPTBA)
  statut?: StatutPTBA;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  pourcentage_avancement?: number;
}

export class QueryPtbaDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: StatutPTBA })
  @IsOptional()
  @IsEnum(StatutPTBA)
  statut?: StatutPTBA;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  composante?: string;

  @ApiPropertyOptional({ description: 'Trimestre : 1, 2, 3 ou 4' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(4)
  trimestre?: number;

  @ApiPropertyOptional()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
