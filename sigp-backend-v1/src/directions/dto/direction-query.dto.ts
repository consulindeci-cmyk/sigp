import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination de la liste des directions.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 */
export class DirectionQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par organisation parente' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'organisation est invalide" })
  organisationId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut actif', type: Boolean })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true';
  })
  @IsBoolean()
  actif?: boolean;
}
