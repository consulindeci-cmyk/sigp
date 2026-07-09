import { ApiProperty } from '@nestjs/swagger';

export class FundingSourceResponseDto {
  @ApiProperty() source: string;
  @ApiProperty() montant: number;
  @ApiProperty() pourcentage: number;
}
