import { ApiProperty } from '@nestjs/swagger';
import { WbsResponseDto } from './wbs-response.dto';

export class WbsPaginationMetaDto {
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

/** Réponse paginée standardisée de la liste des nœuds WBS. */
export class WbsListResponseDto {
  @ApiProperty({ type: [WbsResponseDto] })
  data: WbsResponseDto[];

  @ApiProperty({ type: WbsPaginationMetaDto })
  meta: WbsPaginationMetaDto;
}
