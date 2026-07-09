import { ApiProperty } from '@nestjs/swagger';

export class DisbursementMonthlyResponseDto {
  @ApiProperty({ example: 'Jan 2026' }) month: string;
  @ApiProperty() montantPrevu: number;
  @ApiProperty() montantPaye: number;
}
