import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MethodePassation, StatutMarche, TypeMarche, TypeRevue } from '@prisma/client';

export class CreateProcurementDto {
  @ApiProperty({ example: 'Construction de 5 forages à Korhogo' })
  @IsString()
  @IsNotEmpty()
  description_marche: string;

  @ApiProperty({ enum: TypeMarche })
  @IsEnum(TypeMarche)
  type_marche: TypeMarche;

  @ApiProperty({ enum: MethodePassation })
  @IsEnum(MethodePassation)
  methode: MethodePassation;

  @ApiProperty({ enum: TypeRevue })
  @IsEnum(TypeRevue)
  type_revue: TypeRevue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_prevue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_signature?: string;

  @ApiProperty({ example: '75000000.00' })
  @IsNotEmpty()
  montant_estime: string;

  @ApiPropertyOptional({ enum: StatutMarche, default: StatutMarche.PLANIFIE })
  @IsOptional()
  @IsEnum(StatutMarche)
  statut?: StatutMarche;
}

export class UpdateProcurementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description_marche?: string;

  @ApiPropertyOptional({ enum: TypeMarche })
  @IsOptional()
  @IsEnum(TypeMarche)
  type_marche?: TypeMarche;

  @ApiPropertyOptional({ enum: MethodePassation })
  @IsOptional()
  @IsEnum(MethodePassation)
  methode?: MethodePassation;

  @ApiPropertyOptional({ enum: TypeRevue })
  @IsOptional()
  @IsEnum(TypeRevue)
  type_revue?: TypeRevue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_prevue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_signature?: string;

  @ApiPropertyOptional()
  @IsOptional()
  montant_estime?: string;

  @ApiPropertyOptional({ enum: StatutMarche })
  @IsOptional()
  @IsEnum(StatutMarche)
  statut?: StatutMarche;
}

export class QueryProcurementDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: TypeMarche })
  @IsOptional()
  @IsEnum(TypeMarche)
  type_marche?: TypeMarche;

  @ApiPropertyOptional({ enum: MethodePassation })
  @IsOptional()
  @IsEnum(MethodePassation)
  methode?: MethodePassation;

  @ApiPropertyOptional({ enum: StatutMarche })
  @IsOptional()
  @IsEnum(StatutMarche)
  statut?: StatutMarche;

  @ApiPropertyOptional()
  @IsOptional()
  sortBy?: string = 'date_prevue';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
