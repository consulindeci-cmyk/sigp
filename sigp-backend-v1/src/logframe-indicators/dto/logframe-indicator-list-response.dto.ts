import { ApiProperty } from '@nestjs/swagger';
import { LogframeIndicatorResponseDto } from './logframe-indicator-response.dto';

export class LogframeIndicatorPaginationMetaDto {
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

/** Réponse paginée standardisée de la liste des indicateurs du cadre logique. */
export class LogframeIndicatorListResponseDto {
  @ApiProperty({ type: [LogframeIndicatorResponseDto] })
  data: LogframeIndicatorResponseDto[];

  @ApiProperty({ type: LogframeIndicatorPaginationMetaDto })
  meta: LogframeIndicatorPaginationMetaDto;
}
