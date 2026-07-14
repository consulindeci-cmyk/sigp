import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProjectStatus } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination de la liste des projets.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 */
export class ProjectQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par programme parent' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du programme est invalide" })
  programmeId?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Le statut du projet est invalide' })
  statut?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Filtrer par chef de projet (manager)' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du manager est invalide" })
  managerId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par organisation (isolation multi-tenant)' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'organisation est invalide" })
  organisationId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par bailleur principal' })
  @IsOptional()
  @IsString()
  bailleurPrincipal?: string;

  @ApiPropertyOptional({ description: 'Filtrer par secteur' })
  @IsOptional()
  @IsString()
  secteur?: string;

  @ApiPropertyOptional({ description: 'Filtrer par pays' })
  @IsOptional()
  @IsString()
  pays?: string;
}
