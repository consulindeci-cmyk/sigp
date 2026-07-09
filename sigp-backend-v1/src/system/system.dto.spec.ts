import {
  HealthStatus,
  HealthResponseDto,
  HealthDatabaseDto,
  HealthMemoryDto,
} from './dto/health-response.dto';
import { SystemInfoDto } from './dto/system-info.dto';
import { SystemStatsDto, CpuInfoDto } from './dto/system-stats.dto';

// ─── HealthStatus enum ────────────────────────────────────────────────────────

describe('HealthStatus enum', () => {
  it('has exactly 3 values', () => {
    expect(Object.values(HealthStatus)).toHaveLength(3);
  });

  it('contains UP, DOWN, DEGRADED', () => {
    expect(Object.values(HealthStatus)).toContain('UP');
    expect(Object.values(HealthStatus)).toContain('DOWN');
    expect(Object.values(HealthStatus)).toContain('DEGRADED');
  });
});

// ─── HealthDatabaseDto ────────────────────────────────────────────────────────

describe('HealthDatabaseDto', () => {
  it('accepts status UP with latency', () => {
    const dto: HealthDatabaseDto = { status: 'UP', latencyMs: 12 };
    expect(dto.status).toBe('UP');
    expect(dto.latencyMs).toBe(12);
  });

  it('accepts status DOWN with null latency', () => {
    const dto: HealthDatabaseDto = { status: 'DOWN', latencyMs: null };
    expect(dto.status).toBe('DOWN');
    expect(dto.latencyMs).toBeNull();
  });
});

// ─── HealthMemoryDto ──────────────────────────────────────────────────────────

describe('HealthMemoryDto', () => {
  it('accepts valid memory values', () => {
    const dto: HealthMemoryDto = { usedMb: 512, totalMb: 8192, percentUsed: 6 };
    expect(dto.usedMb).toBe(512);
    expect(dto.totalMb).toBe(8192);
    expect(dto.percentUsed).toBe(6);
  });
});

// ─── HealthResponseDto ────────────────────────────────────────────────────────

describe('HealthResponseDto', () => {
  const now = new Date();

  it('accepts a fully populated UP response', () => {
    const dto: HealthResponseDto = {
      status: HealthStatus.UP,
      uptime: 3600,
      timestamp: now,
      version: '1.0.0',
      environment: 'production',
      database: { status: 'UP', latencyMs: 8 },
      memory: { usedMb: 512, totalMb: 8192, percentUsed: 6 },
      node: 'v20.11.0',
    };

    expect(dto.status).toBe(HealthStatus.UP);
    expect(dto.uptime).toBe(3600);
    expect(dto.timestamp).toBe(now);
    expect(dto.version).toBe('1.0.0');
    expect(dto.environment).toBe('production');
    expect(dto.database.status).toBe('UP');
    expect(dto.memory.totalMb).toBe(8192);
    expect(dto.node).toContain('v');
  });

  it('accepts a DOWN response with null db latency', () => {
    const dto: HealthResponseDto = {
      status: HealthStatus.DOWN,
      uptime: 0,
      timestamp: now,
      version: '1.0.0',
      environment: 'development',
      database: { status: 'DOWN', latencyMs: null },
      memory: { usedMb: 0, totalMb: 0, percentUsed: 0 },
      node: 'v20.0.0',
    };

    expect(dto.status).toBe(HealthStatus.DOWN);
    expect(dto.database.latencyMs).toBeNull();
  });

  it('accepts a DEGRADED response', () => {
    const dto: HealthResponseDto = {
      status: HealthStatus.DEGRADED,
      uptime: 100,
      timestamp: now,
      version: '1.0.0',
      environment: 'staging',
      database: { status: 'UP', latencyMs: 750 },
      memory: { usedMb: 4096, totalMb: 8192, percentUsed: 50 },
      node: 'v20.0.0',
    };

    expect(dto.status).toBe(HealthStatus.DEGRADED);
    expect(dto.database.latencyMs).toBeGreaterThan(500);
  });
});

// ─── SystemInfoDto ────────────────────────────────────────────────────────────

describe('SystemInfoDto', () => {
  it('accepts a fully populated info', () => {
    const dto: SystemInfoDto = {
      appName: 'sigp-backend-v1',
      version: '1.0.0',
      nodeVersion: 'v20.11.0',
      nestVersion: '^11.0.5',
      prismaVersion: '^6.0.0',
      timezone: 'Africa/Dakar',
      os: 'Windows_NT 10.0.26200',
      architecture: 'x64',
    };

    expect(dto.appName).toBe('sigp-backend-v1');
    expect(dto.nodeVersion).toContain('v');
    expect(dto.nestVersion).toContain('11');
    expect(dto.prismaVersion).toContain('6');
    expect(dto.architecture).toBe('x64');
  });
});

// ─── CpuInfoDto ───────────────────────────────────────────────────────────────

describe('CpuInfoDto', () => {
  it('accepts valid CPU info', () => {
    const dto: CpuInfoDto = { model: 'Intel(R) Core(TM) i7', cores: 8 };
    expect(dto.model).toContain('Intel');
    expect(dto.cores).toBe(8);
  });
});

// ─── SystemStatsDto ───────────────────────────────────────────────────────────

describe('SystemStatsDto', () => {
  it('accepts a fully populated stats object', () => {
    const dto: SystemStatsDto = {
      cpu: { model: 'Intel(R) Core(TM) i7-9750H', cores: 12 },
      memoryUsedMb: 2048,
      memoryTotalMb: 16384,
      heapUsedMb: 64,
      heapTotalMb: 128,
      pid: 12345,
      modulesCount: 38,
      uptimeSeconds: 3600,
      uptimeFormatted: '1h 0s',
    };

    expect(dto.cpu.cores).toBe(12);
    expect(dto.memoryUsedMb).toBe(2048);
    expect(dto.memoryTotalMb).toBe(16384);
    expect(dto.heapUsedMb).toBe(64);
    expect(dto.heapTotalMb).toBe(128);
    expect(dto.pid).toBe(12345);
    expect(dto.modulesCount).toBe(38);
    expect(dto.uptimeSeconds).toBe(3600);
    expect(dto.uptimeFormatted).toBe('1h 0s');
  });

  it('heapUsedMb should be less than or equal to heapTotalMb', () => {
    const dto: SystemStatsDto = {
      cpu: { model: 'unknown', cores: 4 },
      memoryUsedMb: 1024,
      memoryTotalMb: 8192,
      heapUsedMb: 50,
      heapTotalMb: 100,
      pid: 1,
      modulesCount: 0,
      uptimeSeconds: 0,
      uptimeFormatted: '0s',
    };

    expect(dto.heapUsedMb).toBeLessThanOrEqual(dto.heapTotalMb);
  });

  it('uptimeFormatted can contain days, hours, minutes, seconds', () => {
    const dto: SystemStatsDto = {
      cpu: { model: 'unknown', cores: 1 },
      memoryUsedMb: 0,
      memoryTotalMb: 0,
      heapUsedMb: 0,
      heapTotalMb: 0,
      pid: 1,
      modulesCount: 0,
      uptimeSeconds: 90061,
      uptimeFormatted: '1d 1h 1m 1s',
    };

    expect(dto.uptimeFormatted).toContain('d');
    expect(dto.uptimeFormatted).toContain('h');
  });
});
