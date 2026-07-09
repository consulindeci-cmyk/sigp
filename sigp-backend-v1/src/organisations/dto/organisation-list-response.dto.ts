import { ApiProperty } from '@nestjs/swagger';
import { OrganisationResponseDto } from './organisation-response.dto';

export class OrganisationPaginationMetaDto {
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

/** Réponse paginée standardisée de la liste des organisations. */
export class OrganisationListResponseDto {
  @ApiProperty({ type: [OrganisationResponseDto] })
  data: OrganisationResponseDto[];

  @ApiProperty({ type: OrganisationPaginationMetaDto })
  meta: OrganisationPaginationMetaDto;
}
