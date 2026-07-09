import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class DocumentQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par livrable' })
  @IsOptional()
  @IsUUID()
  livrableId?: string;

  @ApiPropertyOptional({ enum: DocumentStatus, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(DocumentStatus)
  statut?: DocumentStatus;

  @ApiPropertyOptional({ description: 'Recherche textuelle (titre, description)' })
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
