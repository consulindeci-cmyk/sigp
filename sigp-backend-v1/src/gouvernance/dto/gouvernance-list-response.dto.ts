import { ApiProperty } from '@nestjs/swagger';
import { GouvernanceResponseDto } from './gouvernance-response.dto';

export class GouvernancePaginationMetaDto {
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

/** Réponse paginée standardisée de la liste des entrées de gouvernance. */
export class GouvernanceListResponseDto {
  @ApiProperty({ type: [GouvernanceResponseDto] })
  data: GouvernanceResponseDto[];

  @ApiProperty({ type: GouvernancePaginationMetaDto })
  meta: GouvernancePaginationMetaDto;
}
