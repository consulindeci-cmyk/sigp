import { ApiProperty } from '@nestjs/swagger';

export class DashboardOverviewDto {
  @ApiProperty({ description: "Nombre total d'activités PTBA", example: 30 })
  ptbaTotal: number;

  @ApiProperty({ description: 'Activités PTBA terminées', example: 12 })
  ptbaTermines: number;

  @ApiProperty({ description: 'Activités PTBA en cours', example: 10 })
  ptbaEnCours: number;

  @ApiProperty({ description: 'Activités PTBA non démarrées', example: 8 })
  ptbaNonDemarres: number;

  @ApiProperty({ description: 'Nombre total de livrables', example: 25 })
  livrablesTotal: number;

  @ApiProperty({ description: 'Livrables validés', example: 15 })
  livrablesValides: number;

  @ApiProperty({ description: 'Livrables soumis', example: 5 })
  livrablesSoumis: number;

  @ApiProperty({ description: 'Nombre total de documents', example: 100 })
  documentsTotal: number;

  @ApiProperty({ description: 'Nombre total de rapports', example: 20 })
  rapportsTotal: number;

  @ApiProperty({ description: 'Nombre total de notifications', example: 50 })
  notificationsTotal: number;

  @ApiProperty({ description: 'Notifications non lues', example: 15 })
  notificationsNonLues: number;
}
