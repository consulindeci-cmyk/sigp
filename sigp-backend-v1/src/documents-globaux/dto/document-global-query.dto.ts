import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class DocumentGlobalQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par catégorie' })
  @IsOptional()
  @IsString()
  categorie?: string;

  @ApiPropertyOptional({ enum: DocumentStatus, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(DocumentStatus)
  statut?: DocumentStatus;

  @ApiPropertyOptional({ description: 'Recherche textuelle (titre, description, catégorie)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrer par auteur / créateur (UUID)' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Filtrer par type MIME du fichier' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Filtrer par extension ou type de fichier (ex: PDF, Word, Excel)' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ description: 'Filtrer par date de création (à partir de YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: "Filtrer par date de création (jusqu'à YYYY-MM-DD)" })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Champ de tri (titre, categorie, statut, created_at, updated_at)' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Ordre de tri' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
