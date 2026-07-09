import { ApiProperty } from '@nestjs/swagger';
import { BudgetVersionResponseDto } from './budget-version-response.dto';

export class BudgetVersionPaginationMetaDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

export class BudgetVersionListResponseDto {
  @ApiProperty({ type: [BudgetVersionResponseDto] })
  data: BudgetVersionResponseDto[];

  @ApiProperty({ type: BudgetVersionPaginationMetaDto })
  meta: BudgetVersionPaginationMetaDto;
}
