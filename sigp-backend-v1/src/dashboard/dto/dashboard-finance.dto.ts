import { ApiProperty } from '@nestjs/swagger';

export class DashboardFinanceDto {
  @ApiProperty({
    description: 'Budget total prévu (somme des lignes budgétaires)',
    example: 500000000,
  })
  budgetTotal: number;

  @ApiProperty({ description: 'Montant engagé', example: 200000000 })
  montantEngage: number;

  @ApiProperty({ description: 'Montant payé', example: 150000000 })
  montantPaye: number;

  @ApiProperty({ description: 'Montant restant (budgetTotal - montantPaye)', example: 350000000 })
  montantRestant: number;

  @ApiProperty({ description: 'Nombre de versions budgétaires', example: 3 })
  nombreVersions: number;

  @ApiProperty({ description: 'Nombre de lignes budgétaires', example: 42 })
  nombreLignes: number;

  @ApiProperty({ description: 'Taux de décaissement (pourcentage formatté ex: 30.5%)', example: '30.5%' })
  tauxDecaissement: string;

  @ApiProperty({ description: 'Pourcentage engagé', example: 40 })
  percentEngaged: number;

  @ApiProperty({ description: 'Pourcentage décaissé', example: 30 })
  percentDisbursed: number;

  @ApiProperty({ description: 'Nombre de bailleurs / sources de financement', example: 4 })
  nombreBailleurs: number;
}
