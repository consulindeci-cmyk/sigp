import { ApiProperty } from '@nestjs/swagger';

/**
 * KPIs synthétiques du portefeuille d'utilisateurs.
 * Calculés directement en base de données via Prisma ($transaction / count / groupBy)
 * afin d'éviter le téléchargement de toute la table côté frontend.
 */
export class UserKpisResponseDto {
  @ApiProperty({ description: 'Nombre total d’utilisateurs', example: 42 })
  totalUsers: number;

  @ApiProperty({ description: 'Nombre d’utilisateurs actifs', example: 38 })
  activeUsers: number;

  @ApiProperty({ description: 'Nombre d’utilisateurs inactifs ou désactivés', example: 4 })
  inactiveUsers: number;

  @ApiProperty({ description: 'Nombre d’administrateurs (rôle ADMIN)', example: 3 })
  administrators: number;

  @ApiProperty({ description: 'Nombre de coordinateurs (rôle COORDINATEUR)', example: 12 })
  coordinators: number;

  @ApiProperty({ description: 'Nombre de financiers (rôle FINANCIER)', example: 8 })
  financiers: number;

  @ApiProperty({ description: 'Nombre d’auditeurs (rôle AUDITEUR)', example: 4 })
  auditors: number;

  @ApiProperty({ description: 'Nombre d’observateurs/viewers (rôle VIEWER + CHARGE_PROGRAMME)', example: 15 })
  viewers: number;
}
