import { ApiProperty } from '@nestjs/swagger';

export class DashboardRiskDto {
  @ApiProperty({ description: 'Nombre total de risques', example: 20 })
  total: number;

  @ApiProperty({ description: 'Risques critiques (niveauCriticite = CRITIQUE)', example: 4 })
  critiques: number;

  @ApiProperty({ description: 'Risques élevés (niveauCriticite = ELEVE)', example: 7 })
  eleves: number;
}
