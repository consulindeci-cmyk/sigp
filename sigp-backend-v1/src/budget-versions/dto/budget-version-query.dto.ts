import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { BudgetStatus } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class BudgetVersionQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId?: string;

  @ApiPropertyOptional({ enum: BudgetStatus, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(BudgetStatus, { message: 'Le statut est invalide' })
  statut?: BudgetStatus;

  @ApiPropertyOptional({ example: 1, description: 'Filtrer par numéro de version' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La version doit être un entier' })
  @Min(1)
  version?: number;
}
