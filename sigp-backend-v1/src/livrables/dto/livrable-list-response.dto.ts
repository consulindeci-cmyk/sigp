import { ApiProperty } from '@nestjs/swagger';
import { LivrableResponseDto } from './livrable-response.dto';

export class LivrablePaginationMetaDto {
  @ApiProperty({ example: 42 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
  @ApiProperty({ example: 3 }) totalPages: number;
  @ApiProperty({ example: true }) hasNextPage: boolean;
  @ApiProperty({ example: false }) hasPreviousPage: boolean;
}

export class LivrableListResponseDto {
  @ApiProperty({ type: [LivrableResponseDto] })
  data: LivrableResponseDto[];

  @ApiProperty({ type: LivrablePaginationMetaDto })
  meta: LivrablePaginationMetaDto;
}
