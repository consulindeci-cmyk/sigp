import { ApiProperty } from '@nestjs/swagger';

export class EvmSummaryResponseDto {
  @ApiProperty({ description: 'Planned Value (Valeur Planifiée)', example: 120000 })
  pv: number;

  @ApiProperty({ description: 'Earned Value (Valeur Acquise)', example: 100000 })
  ev: number;

  @ApiProperty({ description: 'Actual Cost (Coût Réel)', example: 110000 })
  ac: number;

  @ApiProperty({ description: 'Schedule Variance (Écart de Délai)', example: -20000 })
  sv: number;

  @ApiProperty({ description: 'Cost Variance (Écart de Coût)', example: -10000 })
  cv: number;

  @ApiProperty({
    description: 'Schedule Performance Index (Indice de Performance des Délais)',
    example: 0.83,
  })
  spi: number;

  @ApiProperty({
    description: 'Cost Performance Index (Indice de Performance des Coûts)',
    example: 0.91,
  })
  cpi: number;

  @ApiProperty({
    description: "Estimate At Completion (Estimation à l'Achèvement)",
    example: 550000,
  })
  eac: number;

  @ApiProperty({ description: 'Estimate To Complete (Reste à Faire)', example: 440000 })
  etc: number;

  @ApiProperty({ description: "Variance At Completion (Écart à l'Achèvement)", example: -50000 })
  vac: number;
}
