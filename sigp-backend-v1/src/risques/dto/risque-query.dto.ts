import { ApiPropertyOptional } from '@nestjs/swagger';
import { RiskImpact, RiskProbability, RiskStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class RisqueQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: RiskProbability, description: 'Filtrer par probabilité' })
  @IsOptional()
  @IsEnum(RiskProbability)
  probabilite?: RiskProbability;

  @ApiPropertyOptional({ enum: RiskImpact, description: 'Filtrer par impact' })
  @IsOptional()
  @IsEnum(RiskImpact)
  impact?: RiskImpact;

  @ApiPropertyOptional({ enum: RiskStatus, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(RiskStatus)
  statut?: RiskStatus;

  @ApiPropertyOptional({
    description: 'Recherche textuelle (code, description, catégorie, stratégie)',
  })
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
