import { ApiProperty } from '@nestjs/swagger';
import { ReportResponseDto } from './report-response.dto';

class ReportPaginationMetaDto {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class ReportListResponseDto {
  @ApiProperty({ type: [ReportResponseDto] }) data: ReportResponseDto[];
  @ApiProperty({ type: ReportPaginationMetaDto }) meta: ReportPaginationMetaDto;
}
