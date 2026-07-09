import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '@/auth/decorators/public.decorator';
import { ApiAuth } from '@/auth/decorators/api-auth.decorator';
import { SystemService } from './system.service';
import { HealthResponseDto } from './dto/health-response.dto';
import { SystemInfoDto } from './dto/system-info.dto';
import { SystemStatsDto } from './dto/system-stats.dto';

@ApiTags('System')
@Controller({ path: 'system', version: '1' })
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'État de santé du backend SIGP' })
  @ApiOkResponse({ description: 'Statut de santé du service', type: HealthResponseDto })
  health(): Promise<HealthResponseDto> {
    return this.systemService.health();
  }

  @Get('info')
  @ApiAuth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Informations système du backend SIGP' })
  @ApiOkResponse({ description: 'Informations système', type: SystemInfoDto })
  info(): SystemInfoDto {
    return this.systemService.info();
  }

  @Get('stats')
  @ApiAuth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Statistiques système du backend SIGP' })
  @ApiOkResponse({ description: 'Statistiques système', type: SystemStatsDto })
  stats(): SystemStatsDto {
    return this.systemService.stats();
  }
}
