import { ApiProperty } from '@nestjs/swagger';

export class DashboardProjectDto {
  @ApiProperty({ description: 'Nombre total de projets', example: 15 })
  total: number;

  @ApiProperty({ description: 'Projets actifs (EN_COURS)', example: 8 })
  actifs: number;

  @ApiProperty({ description: 'Projets terminés (CLOTURE)', example: 5 })
  termines: number;

  @ApiProperty({ description: 'Projets suspendus', example: 2 })
  suspendus: number;
}
