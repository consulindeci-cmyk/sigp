import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutTache } from '@prisma/client';

export class CreateOperationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tache_id: string;

  @ApiProperty({ example: '2025-03-15' })
  @IsDateString()
  date_operation: string;

  @ApiProperty({ enum: StatutTache })
  @IsEnum(StatutTache)
  statut: StatutTache;

  @ApiPropertyOptional({ default: '0' })
  @IsOptional()
  montant_engage?: string;

  @ApiPropertyOptional({ default: '0' })
  @IsOptional()
  montant_decaisse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class QueryOperationsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;

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
  @IsString()
  tache_id?: string;
}
