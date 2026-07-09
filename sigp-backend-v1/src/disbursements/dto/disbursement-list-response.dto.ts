import { ApiProperty } from '@nestjs/swagger';
import { DisbursementResponseDto } from './disbursement-response.dto';

export class DisbursementPaginationMetaDto {
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

export class DisbursementListResponseDto {
  @ApiProperty({ type: [DisbursementResponseDto] })
  data: DisbursementResponseDto[];

  @ApiProperty({ type: DisbursementPaginationMetaDto })
  meta: DisbursementPaginationMetaDto;
}
