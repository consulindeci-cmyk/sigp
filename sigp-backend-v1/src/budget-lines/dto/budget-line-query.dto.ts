import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '@/shared/dto/pagination.dto';

export class BudgetLineQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrer par version budgétaire' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la version est invalide" })
  versionId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par ligne parente' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la ligne parente est invalide" })
  parentId?: string;
}
