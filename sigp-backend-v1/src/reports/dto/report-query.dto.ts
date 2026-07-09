import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FormatRapport, StatutRapport, TypeRapport } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class ReportQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: TypeRapport, description: 'Filtrer par type' })
  @IsOptional()
  @IsEnum(TypeRapport)
  type?: TypeRapport;

  @ApiPropertyOptional({ enum: FormatRapport, description: 'Filtrer par format' })
  @IsOptional()
  @IsEnum(FormatRapport)
  format?: FormatRapport;

  @ApiPropertyOptional({ enum: StatutRapport, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(StatutRapport)
  statut?: StatutRapport;

  @ApiPropertyOptional({ description: 'Recherche textuelle (titre, description, auteur)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Champ de tri' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Ordre de tri' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
