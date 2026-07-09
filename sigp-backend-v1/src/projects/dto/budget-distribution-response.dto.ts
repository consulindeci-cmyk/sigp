import { ApiProperty } from '@nestjs/swagger';

export class BudgetDistributionResponseDto {
  @ApiProperty() rubrique: string;
  @ApiProperty() montant: number;
}
