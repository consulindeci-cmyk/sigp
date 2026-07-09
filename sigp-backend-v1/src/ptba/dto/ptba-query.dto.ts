import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { PtbaStatut } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination de la liste des activités PTBA.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 * `search` s'applique à code, libelle et description (insensible à la casse).
 */
export class PtbaQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId?: string;

  @ApiPropertyOptional({ enum: PtbaStatut, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(PtbaStatut, { message: 'Le statut est invalide' })
  statut?: PtbaStatut;

  @ApiPropertyOptional({ example: 2026, description: 'Filtrer par année' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "L'année doit être un entier" })
  @Min(2000)
  @Max(2100)
  annee?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filtrer par trimestre (1 à 4)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le trimestre doit être un entier' })
  @Min(1)
  @Max(4)
  trimestre?: number;

  @ApiPropertyOptional({ description: 'Filtrer par nœud WBS' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du nœud WBS est invalide" })
  wbsId?: string;
}
