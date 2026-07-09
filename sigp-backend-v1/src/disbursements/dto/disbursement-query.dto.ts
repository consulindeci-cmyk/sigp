import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DisbursementStatus } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class DisbursementQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par version budgétaire' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la version budgétaire est invalide" })
  budgetVersionId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par ligne budgétaire' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la ligne budgétaire est invalide" })
  budgetLineId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par source de financement' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la source de financement est invalide" })
  fundingSourceId?: string;

  @ApiPropertyOptional({ enum: DisbursementStatus, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(DisbursementStatus, { message: 'Le statut du décaissement est invalide' })
  statut?: DisbursementStatus;
}
