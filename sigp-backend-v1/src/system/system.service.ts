import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as os from 'os';
import { PrismaService } from '@/prisma/prisma.service';
import { HealthResponseDto, HealthStatus } from './dto/health-response.dto';
import { SystemInfoDto } from './dto/system-info.dto';
import { SystemStatsDto } from './dto/system-stats.dto';

const HIGH_LATENCY_THRESHOLD_MS = 500;

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  async health(): Promise<HealthResponseDto> {
    let dbStatus: 'UP' | 'DOWN' = 'DOWN';
    let dbLatency: number | null = null;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
      dbStatus = 'UP';
    } catch {
      // database is unreachable
    }

    let status: HealthStatus;
    if (dbStatus === 'DOWN') {
      status = HealthStatus.DOWN;
    } else if (dbLatency !== null && dbLatency > HIGH_LATENCY_THRESHOLD_MS) {
      status = HealthStatus.DEGRADED;
    } else {
      status = HealthStatus.UP;
    }

    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();

    return {
      status,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date(),
      version: this.readPackageVersion(),
      environment: process.env['NODE_ENV'] ?? 'development',
      database: { status: dbStatus, latencyMs: dbLatency },
      memory: {
        usedMb: Math.round(usedMem / 1024 / 1024),
        totalMb: Math.round(totalMem / 1024 / 1024),
        percentUsed: Math.round((usedMem / totalMem) * 100),
      },
      node: process.version,
    };
  }

  info(): SystemInfoDto {
    const pkg = this.readPackageJson();
    const deps = (pkg['dependencies'] ?? {}) as Record<string, string>;
    const devDeps = (pkg['devDependencies'] ?? {}) as Record<string, string>;

    return {
      appName: (pkg['name'] as string) ?? 'sigp-backend-v1',
      version: (pkg['version'] as string) ?? '1.0.0',
      nodeVersion: process.version,
      nestVersion: deps['@nestjs/core'] ?? devDeps['@nestjs/core'] ?? 'unknown',
      prismaVersion: deps['prisma'] ?? devDeps['prisma'] ?? 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      os: `${os.type()} ${os.release()}`,
      architecture: os.arch(),
    };
  }

  stats(): SystemStatsDto {
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();
    const cpus = os.cpus();
    const uptimeSeconds = Math.floor(process.uptime());

    return {
      cpu: {
        model: cpus[0]?.model ?? 'unknown',
        cores: cpus.length,
      },
      memoryUsedMb: Math.round(usedMem / 1024 / 1024),
      memoryTotalMb: Math.round(totalMem / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      pid: process.pid,
      modulesCount: this.countRegisteredModules(),
      uptimeSeconds,
      uptimeFormatted: this.formatUptime(uptimeSeconds),
    };
  }

  private readPackageJson(): Record<string, unknown> {
    const pkgPath = join(process.cwd(), 'package.json');
    return JSON.parse(readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
  }

  private readPackageVersion(): string {
    try {
      return (this.readPackageJson()['version'] as string) ?? '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  private countRegisteredModules(): number {
    const appPath = process.cwd();
    return Object.keys(require.cache).filter(
      (key) => key.startsWith(appPath) && key.includes('.module.'),
    ).length;
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  }
}
