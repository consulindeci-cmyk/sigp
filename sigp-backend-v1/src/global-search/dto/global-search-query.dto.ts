import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum SearchModuleFilter {
  PROJECTS = 'projects',
  PTBA = 'ptba',
  BUDGET = 'budget',
  RISQUES = 'risques',
  PPM = 'ppm',
  LIVRABLES = 'livrables',
  DOCUMENTS = 'documents',
  REPORTS = 'reports',
  NOTIFICATIONS = 'notifications',
}

export class GlobalSearchQueryDto {
  @ApiProperty({ description: 'Terme de recherche (minimum 2 caractères)', minLength: 2 })
  @IsString()
  @MinLength(2, { message: 'Le terme de recherche doit contenir au moins 2 caractères' })
  query: string;

  @ApiPropertyOptional({
    enum: SearchModuleFilter,
    description: 'Filtrer la recherche par module',
  })
  @IsOptional()
  @IsEnum(SearchModuleFilter, { message: 'Le module de recherche est invalide' })
  module?: SearchModuleFilter;
}
