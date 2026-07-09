import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination de la liste des départements.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 */
export class DepartementQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par direction parente' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la direction est invalide" })
  directionId?: string;

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
