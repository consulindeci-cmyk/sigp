import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { IndicatorType } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination de la liste des indicateurs du cadre logique.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 * `search` s'applique à code, libelle et unite (insensible à la casse).
 */
export class LogframeIndicatorQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par objectif du cadre logique' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'objectif est invalide" })
  objectiveId?: string;

  @ApiPropertyOptional({ enum: IndicatorType, description: 'Filtrer par type' })
  @IsOptional()
  @IsEnum(IndicatorType, { message: "Le type d'indicateur est invalide" })
  type?: IndicatorType;

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
