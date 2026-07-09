import { ApiProperty } from '@nestjs/swagger';

export enum HealthStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  DEGRADED = 'DEGRADED',
}

export class HealthDatabaseDto {
  @ApiProperty({ description: 'Statut de la base de données', enum: ['UP', 'DOWN'] })
  status: 'UP' | 'DOWN';

  @ApiProperty({ description: 'Latence en millisecondes', example: 12, nullable: true })
  latencyMs: number | null;
}

export class HealthMemoryDto {
  @ApiProperty({ description: 'Mémoire utilisée (Mo)', example: 512 })
  usedMb: number;

  @ApiProperty({ description: 'Mémoire totale (Mo)', example: 8192 })
  totalMb: number;

  @ApiProperty({ description: 'Pourcentage utilisé', example: 6 })
  percentUsed: number;
}

export class HealthResponseDto {
  @ApiProperty({
    enum: HealthStatus,
    description: 'Statut global du service',
    example: HealthStatus.UP,
  })
  status: HealthStatus;

  @ApiProperty({ description: 'Temps de fonctionnement en secondes', example: 3600 })
  uptime: number;

  @ApiProperty({ description: 'Horodatage de la réponse' })
  timestamp: Date;

  @ApiProperty({ description: "Version de l'application", example: '1.0.0' })
  version: string;

  @ApiProperty({ description: 'Environnement Node.js', example: 'production' })
  environment: string;

  @ApiProperty({ description: 'Statut de la base de données', type: HealthDatabaseDto })
  database: HealthDatabaseDto;

  @ApiProperty({ description: 'Utilisation mémoire système', type: HealthMemoryDto })
  memory: HealthMemoryDto;

  @ApiProperty({ description: 'Version Node.js', example: 'v20.11.0' })
  node: string;
}
