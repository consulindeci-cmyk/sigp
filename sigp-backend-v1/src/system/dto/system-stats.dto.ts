import { ApiProperty } from '@nestjs/swagger';

export class CpuInfoDto {
  @ApiProperty({ description: 'Modèle du processeur', example: 'Intel(R) Core(TM) i7-9750H' })
  model: string;

  @ApiProperty({ description: 'Nombre de cœurs logiques', example: 12 })
  cores: number;
}

export class SystemStatsDto {
  @ApiProperty({ description: 'Informations CPU', type: CpuInfoDto })
  cpu: CpuInfoDto;

  @ApiProperty({ description: 'Mémoire système utilisée (Mo)', example: 512 })
  memoryUsedMb: number;

  @ApiProperty({ description: 'Mémoire système totale (Mo)', example: 8192 })
  memoryTotalMb: number;

  @ApiProperty({ description: 'Heap V8 utilisé (Mo)', example: 64 })
  heapUsedMb: number;

  @ApiProperty({ description: 'Heap V8 total (Mo)', example: 128 })
  heapTotalMb: number;

  @ApiProperty({ description: 'PID du processus Node.js', example: 12345 })
  pid: number;

  @ApiProperty({ description: 'Nombre de modules NestJS enregistrés', example: 38 })
  modulesCount: number;

  @ApiProperty({ description: 'Temps de fonctionnement en secondes', example: 3600 })
  uptimeSeconds: number;

  @ApiProperty({ description: 'Temps de fonctionnement formaté', example: '1h 0m 0s' })
  uptimeFormatted: string;
}
