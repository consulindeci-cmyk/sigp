import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { WbsNodeType } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination de la liste des nœuds WBS.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 * `search` s'applique à code et libelle (insensible à la casse).
 */
export class WbsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par nœud parent' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du nœud parent est invalide" })
  parentId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par objectif du cadre logique' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'objectif est invalide" })
  objectiveId?: string;

  @ApiPropertyOptional({ enum: WbsNodeType, description: 'Filtrer par type' })
  @IsOptional()
  @IsEnum(WbsNodeType, { message: 'Le type de nœud est invalide' })
  type?: WbsNodeType;

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
