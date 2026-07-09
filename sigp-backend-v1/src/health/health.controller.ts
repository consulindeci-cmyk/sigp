import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/auth/decorators/public.decorator';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';

@ApiTags('health')
@Public()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  private readonly version = process.env['npm_package_version'] ?? '1.0.0';

  constructor(
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Vérification de santé du service' })
  async check() {
    const [db, redis] = await Promise.all([
      this.prismaHealth.isHealthy(),
      this.redisHealth.isHealthy(),
    ]);

    const allUp = db.status === 'up' && redis.status === 'up';
    const mem = process.memoryUsage();

    return {
      status: allUp ? 'ok' : 'degraded',
      database: db.status,
      redis: redis.status,
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
      },
      version: this.version,
      timestamp: new Date().toISOString(),
    };
  }
}
