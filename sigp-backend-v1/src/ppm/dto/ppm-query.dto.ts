import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PpmMarcheStatus, PpmTypeMarche } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class PpmQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: PpmTypeMarche, description: 'Filtrer par type' })
  @IsOptional()
  @IsEnum(PpmTypeMarche)
  type?: PpmTypeMarche;

  @ApiPropertyOptional({ enum: PpmMarcheStatus, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(PpmMarcheStatus)
  statut?: PpmMarcheStatus;

  @ApiPropertyOptional({ description: 'Recherche textuelle (code, intitulé, titulaire, notes)' })
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
