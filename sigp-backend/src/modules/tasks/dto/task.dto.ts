import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutTache } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wbs_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ligne_budgetaire_id?: string;

  @ApiProperty({ example: 'T-001' })
  @IsString()
  @IsNotEmpty()
  code_tache: string;

  @ApiProperty({ example: 'Construction du forage de Bouaké' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsable?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_fin?: string;

  @ApiProperty({ example: '150000.00' })
  @IsNotEmpty()
  cout_prevu: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  cout_reel?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  avancement?: number;

  @ApiPropertyOptional({ enum: StatutTache, default: StatutTache.A_FAIRE })
  @IsOptional()
  @IsEnum(StatutTache)
  statut?: StatutTache;
}

export class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wbs_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ligne_budgetaire_id?: string;

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
  @IsDateString()
  date_debut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_fin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  cout_prevu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  cout_reel?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  avancement?: number;

  @ApiPropertyOptional({ enum: StatutTache })
  @IsOptional()
  @IsEnum(StatutTache)
  statut?: StatutTache;
}

export class QueryTasksDto {
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

  @ApiPropertyOptional({ enum: StatutTache })
  @IsOptional()
  @IsEnum(StatutTache)
  statut?: StatutTache;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wbs_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsable?: string;

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
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
