import { ApiProperty } from '@nestjs/swagger';
import { PpmEtapeResponseDto } from './ppm-etape-response.dto';

export class PpmEtapePaginationMetaDto {
  @ApiProperty({ example: 42 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
  @ApiProperty({ example: 3 }) totalPages: number;
  @ApiProperty({ example: true }) hasNextPage: boolean;
  @ApiProperty({ example: false }) hasPreviousPage: boolean;
}

export class PpmEtapeListResponseDto {
  @ApiProperty({ type: [PpmEtapeResponseDto] })
  data: PpmEtapeResponseDto[];

  @ApiProperty({ type: PpmEtapePaginationMetaDto })
  meta: PpmEtapePaginationMetaDto;
}
