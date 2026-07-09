import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { OrganisationType } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination de la liste des organisations.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 */
export class OrganisationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: OrganisationType, description: 'Filtrer par type' })
  @IsOptional()
  @IsEnum(OrganisationType, { message: "Le type d'organisation est invalide" })
  type?: OrganisationType;

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
