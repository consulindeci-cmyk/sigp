import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { JournalType } from '@prisma/client';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class JournalOperationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par ligne budgétaire' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la ligne budgétaire est invalide" })
  budgetLineId?: string;

  @ApiPropertyOptional({ enum: JournalType, description: 'Filtrer par type de mouvement' })
  @IsOptional()
  @IsEnum(JournalType, { message: 'Le type est invalide' })
  type?: JournalType;
}
