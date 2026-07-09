import { ApiProperty } from '@nestjs/swagger';
import { FundingSourceResponseDto } from './funding-source-response.dto';

export class FundingSourcePaginationMetaDto {
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

export class FundingSourceListResponseDto {
  @ApiProperty({ type: [FundingSourceResponseDto] })
  data: FundingSourceResponseDto[];

  @ApiProperty({ type: FundingSourcePaginationMetaDto })
  meta: FundingSourcePaginationMetaDto;
}
