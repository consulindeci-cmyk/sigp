import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { FundingSourceType } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class FundingSourceQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par projet' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId?: string;

  @ApiPropertyOptional({ enum: FundingSourceType, description: 'Filtrer par type' })
  @IsOptional()
  @IsEnum(FundingSourceType, { message: 'Le type de source de financement est invalide' })
  type?: FundingSourceType;
}
