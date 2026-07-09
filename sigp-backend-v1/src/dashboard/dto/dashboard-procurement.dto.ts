import { ApiProperty } from '@nestjs/swagger';

export class DashboardProcurementDto {
  @ApiProperty({ description: 'Nombre total de marchés PPM', example: 10 })
  marchesTotal: number;

  @ApiProperty({ description: 'Marchés terminés (CLOTURE)', example: 3 })
  marchesTermines: number;

  @ApiProperty({ description: 'Marchés en cours (marchesTotal - marchesTermines)', example: 7 })
  marchesEnCours: number;

  @ApiProperty({ description: "Nombre total d'étapes PPM", example: 45 })
  etapesTotal: number;
}
