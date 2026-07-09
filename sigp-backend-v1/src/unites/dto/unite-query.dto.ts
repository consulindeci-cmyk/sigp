import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination de la liste des unités.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 */
export class UniteQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par département parent' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du département est invalide" })
  departementId?: string;

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
