import { ApiPropertyOptional } from '@nestjs/swagger';
import { LivrableStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class LivrableQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: LivrableStatus, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(LivrableStatus)
  statut?: LivrableStatus;

  @ApiPropertyOptional({ description: 'Recherche textuelle (code, nom, description, notes)' })
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
