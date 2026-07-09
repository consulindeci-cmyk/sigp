import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/** Filtre de statut de compte pour la liste des utilisateurs. */
export enum UserStatusFilter {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * Filtres + pagination de la liste des utilisateurs.
 * Hérite de PaginationDto : page, limit, search, sortBy (orderBy), sortOrder.
 */
export class UserQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filtrer par rôle' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Le rôle est invalide' })
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatusFilter, description: 'Filtrer par statut de compte' })
  @IsOptional()
  @IsEnum(UserStatusFilter, { message: 'Le statut est invalide' })
  status?: UserStatusFilter;
}
