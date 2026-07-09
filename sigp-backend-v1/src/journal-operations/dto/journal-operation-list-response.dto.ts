import { ApiProperty } from '@nestjs/swagger';
import { JournalOperationResponseDto } from './journal-operation-response.dto';

export class JournalOperationPaginationMetaDto {
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

export class JournalOperationListResponseDto {
  @ApiProperty({ type: [JournalOperationResponseDto] })
  data: JournalOperationResponseDto[];

  @ApiProperty({ type: JournalOperationPaginationMetaDto })
  meta: JournalOperationPaginationMetaDto;
}
