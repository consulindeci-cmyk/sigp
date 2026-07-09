import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ContractStatus, ContractType } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class ContractQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: ContractType, description: 'Filtrer par type' })
  @IsOptional()
  @IsEnum(ContractType)
  type?: ContractType;

  @ApiPropertyOptional({ enum: ContractStatus, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(ContractStatus)
  statut?: ContractStatus;

  @ApiPropertyOptional({ description: 'Recherche textuelle (numéro, intitulé, titulaire, notes)' })
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
