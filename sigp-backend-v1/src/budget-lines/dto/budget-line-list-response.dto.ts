import { ApiProperty } from '@nestjs/swagger';
import { BudgetLineResponseDto } from './budget-line-response.dto';

export class BudgetLinePaginationMetaDto {
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

export class BudgetLineListResponseDto {
  @ApiProperty({ type: [BudgetLineResponseDto] })
  data: BudgetLineResponseDto[];

  @ApiProperty({ type: BudgetLinePaginationMetaDto })
  meta: BudgetLinePaginationMetaDto;
}
