import { ApiProperty } from '@nestjs/swagger';
import { PtbaResponseDto } from './ptba-response.dto';

export class PtbaPaginationMetaDto {
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

/** Réponse paginée standardisée de la liste des activités PTBA. */
export class PtbaListResponseDto {
  @ApiProperty({ type: [PtbaResponseDto] })
  data: PtbaResponseDto[];

  @ApiProperty({ type: PtbaPaginationMetaDto })
  meta: PtbaPaginationMetaDto;
}
