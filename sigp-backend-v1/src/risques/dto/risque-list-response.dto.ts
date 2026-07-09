import { ApiProperty } from '@nestjs/swagger';
import { RisqueResponseDto } from './risque-response.dto';

export class RisquePaginationMetaDto {
  @ApiProperty({ example: 42 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
  @ApiProperty({ example: 3 }) totalPages: number;
  @ApiProperty({ example: true }) hasNextPage: boolean;
  @ApiProperty({ example: false }) hasPreviousPage: boolean;
}

export class RisqueListResponseDto {
  @ApiProperty({ type: [RisqueResponseDto] })
  data: RisqueResponseDto[];

  @ApiProperty({ type: RisquePaginationMetaDto })
  meta: RisquePaginationMetaDto;
}
