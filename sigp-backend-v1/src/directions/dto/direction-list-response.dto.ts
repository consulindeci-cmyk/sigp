import { ApiProperty } from '@nestjs/swagger';
import { DirectionResponseDto } from './direction-response.dto';

export class DirectionPaginationMetaDto {
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

/** Réponse paginée standardisée de la liste des directions. */
export class DirectionListResponseDto {
  @ApiProperty({ type: [DirectionResponseDto] })
  data: DirectionResponseDto[];

  @ApiProperty({ type: DirectionPaginationMetaDto })
  meta: DirectionPaginationMetaDto;
}
