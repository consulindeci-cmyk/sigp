import { ApiProperty } from '@nestjs/swagger';
import { HistoryResponseDto } from './history-response.dto';

class HistoryPaginationMetaDto {
  @ApiProperty({ example: 42 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
  @ApiProperty({ example: 3 }) totalPages: number;
  @ApiProperty({ example: true }) hasNextPage: boolean;
  @ApiProperty({ example: false }) hasPreviousPage: boolean;
}

export class HistoryListResponseDto {
  @ApiProperty({ type: [HistoryResponseDto] }) data: HistoryResponseDto[];
  @ApiProperty({ type: HistoryPaginationMetaDto }) meta: HistoryPaginationMetaDto;
}
