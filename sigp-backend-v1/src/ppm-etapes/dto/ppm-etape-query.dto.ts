import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class PpmEtapeQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par marché PPM' })
  @IsOptional()
  @IsUUID()
  marcheId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut de complétion' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  complete?: boolean;

  @ApiPropertyOptional({ description: 'Recherche textuelle (libellé, notes)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Champ de tri' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Ordre de tri' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
