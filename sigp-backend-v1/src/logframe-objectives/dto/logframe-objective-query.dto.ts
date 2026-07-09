import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { LogframeLevel } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination de la liste des objectifs du cadre logique.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 * `search` s'applique à code, libelle et description (insensible à la casse).
 */
export class LogframeObjectiveQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId?: string;

  @ApiPropertyOptional({ enum: LogframeLevel, description: 'Filtrer par niveau' })
  @IsOptional()
  @IsEnum(LogframeLevel, { message: 'Le niveau est invalide' })
  niveau?: LogframeLevel;

  @ApiPropertyOptional({ description: 'Filtrer par objectif parent' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'objectif parent est invalide" })
  parentId?: string;

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
