import { ApiProperty } from '@nestjs/swagger';
import { DepartementResponseDto } from './departement-response.dto';

export class DepartementPaginationMetaDto {
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

/** Réponse paginée standardisée de la liste des départements. */
export class DepartementListResponseDto {
  @ApiProperty({ type: [DepartementResponseDto] })
  data: DepartementResponseDto[];

  @ApiProperty({ type: DepartementPaginationMetaDto })
  meta: DepartementPaginationMetaDto;
}
