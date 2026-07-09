import { ApiProperty } from '@nestjs/swagger';

export class EvmHistoryResponseDto {
  @ApiProperty({ description: 'Période au format YYYY-MM', example: '2023-10' })
  periode: string;

  @ApiProperty({ description: 'Planned Value (Valeur Planifiée)', example: 120000 })
  pv: number;

  @ApiProperty({ description: 'Earned Value (Valeur Acquise)', example: 100000 })
  ev: number;

  @ApiProperty({ description: 'Actual Cost (Coût Réel)', example: 110000 })
  ac: number;
}
