import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination de la liste des entrées de gouvernance.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 * `search` s'applique à nom, role, organisation et email (insensible à la casse).
 */
export class GouvernanceQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par utilisateur système lié' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'utilisateur est invalide" })
  userId?: string;
}
