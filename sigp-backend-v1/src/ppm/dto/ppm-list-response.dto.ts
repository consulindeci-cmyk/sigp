import { ApiProperty } from '@nestjs/swagger';
import { PpmResponseDto } from './ppm-response.dto';

export class PpmPaginationMetaDto {
  @ApiProperty({ example: 42 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
  @ApiProperty({ example: 3 }) totalPages: number;
  @ApiProperty({ example: true }) hasNextPage: boolean;
  @ApiProperty({ example: false }) hasPreviousPage: boolean;
}

export class PpmListResponseDto {
  @ApiProperty({ type: [PpmResponseDto] })
  data: PpmResponseDto[];

  @ApiProperty({ type: PpmPaginationMetaDto })
  meta: PpmPaginationMetaDto;
}
