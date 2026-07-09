import { ApiProperty } from '@nestjs/swagger';
import { ProgrammeResponseDto } from './programme-response.dto';

export class ProgrammePaginationMetaDto {
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

/** Réponse paginée standardisée de la liste des programmes. */
export class ProgrammeListResponseDto {
  @ApiProperty({ type: [ProgrammeResponseDto] })
  data: ProgrammeResponseDto[];

  @ApiProperty({ type: ProgrammePaginationMetaDto })
  meta: ProgrammePaginationMetaDto;
}
