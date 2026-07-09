import { ApiProperty } from '@nestjs/swagger';

export class SystemInfoDto {
  @ApiProperty({ description: "Nom de l'application", example: 'sigp-backend-v1' })
  appName: string;

  @ApiProperty({ description: "Version de l'application", example: '1.0.0' })
  version: string;

  @ApiProperty({ description: 'Version Node.js', example: 'v20.11.0' })
  nodeVersion: string;

  @ApiProperty({ description: 'Version NestJS', example: '^11.0.5' })
  nestVersion: string;

  @ApiProperty({ description: 'Version Prisma', example: '^6.0.0' })
  prismaVersion: string;

  @ApiProperty({ description: 'Fuseau horaire système', example: 'Africa/Dakar' })
  timezone: string;

  @ApiProperty({ description: "Système d'exploitation", example: 'Linux 5.15.0' })
  os: string;

  @ApiProperty({ description: 'Architecture processeur', example: 'x64' })
  architecture: string;
}
