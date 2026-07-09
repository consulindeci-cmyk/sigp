import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProgrammeStatus } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

/**
 * Filtres + pagination de la liste des programmes.
 * Hérite de PaginationDto : page, limit, search, sortBy, sortOrder.
 */
export class ProgrammeQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par unité parente' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'unité est invalide" })
  uniteId?: string;

  @ApiPropertyOptional({ enum: ProgrammeStatus, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(ProgrammeStatus, { message: 'Le statut du programme est invalide' })
  statut?: ProgrammeStatus;

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
