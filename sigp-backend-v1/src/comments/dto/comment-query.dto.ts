import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination pour la liste des commentaires.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 * `search` s'applique au message (insensible à la casse).
 */
export class CommentQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par statut' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  statut?: string;

  @ApiPropertyOptional({ description: 'Filtrer par priorité' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  priorite?: string;

  @ApiPropertyOptional({ description: 'Filtrer par module' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  module?: string;

  @ApiPropertyOptional({ description: 'Filtrer par auteur (user_id)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filtrer les commentaires non lus', type: Boolean })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true';
  })
  @IsBoolean()
  lu?: boolean;
}
