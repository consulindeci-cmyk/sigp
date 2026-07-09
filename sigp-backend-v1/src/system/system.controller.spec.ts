import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { HealthResponseDto, HealthStatus } from './dto/health-response.dto';
import { SystemInfoDto } from './dto/system-info.dto';
import { SystemStatsDto } from './dto/system-stats.dto';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildHealthResponse(): HealthResponseDto {
  return {
    status: HealthStatus.UP,
    uptime: 3600,
    timestamp: new Date('2026-07-08T10:00:00Z'),
    version: '1.0.0',
    environment: 'test',
    database: { status: 'UP', latencyMs: 8 },
    memory: { usedMb: 512, totalMb: 8192, percentUsed: 6 },
    node: 'v20.11.0',
  };
}

function buildInfoResponse(): SystemInfoDto {
  return {
    appName: 'sigp-backend-v1',
    version: '1.0.0',
    nodeVersion: 'v20.11.0',
    nestVersion: '^11.0.5',
    prismaVersion: '^6.0.0',
    timezone: 'Africa/Dakar',
    os: 'Windows_NT 10.0.26200',
    architecture: 'x64',
  };
}

function buildStatsResponse(): SystemStatsDto {
  return {
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
}

function buildMocks() {
  const systemService = {
    health: jest.fn().mockResolvedValue(buildHealthResponse()),
    info: jest.fn().mockReturnValue(buildInfoResponse()),
    stats: jest.fn().mockReturnValue(buildStatsResponse()),
  } as unknown as jest.Mocked<SystemService>;

  const controller = new SystemController(systemService);
  return { controller, systemService };
}

// ─── GET /system/health ───────────────────────────────────────────────────────

describe('SystemController.health()', () => {
  it('delegates to systemService.health()', async () => {
    const { controller, systemService } = buildMocks();

    await controller.health();

    expect(systemService.health).toHaveBeenCalledTimes(1);
  });

  it('returns the service health response', async () => {
    const { controller } = buildMocks();

    const result = await controller.health();

    expect(result.status).toBe(HealthStatus.UP);
    expect(result.database.status).toBe('UP');
    expect(result.memory.totalMb).toBe(8192);
    expect(result.node).toBe('v20.11.0');
  });

  it('propagates service errors', async () => {
    const { controller, systemService } = buildMocks();
    systemService.health.mockRejectedValueOnce(new Error('Health check failed'));

    await expect(controller.health()).rejects.toThrow('Health check failed');
  });

  it('returns a DOWN status when service reports it', async () => {
    const { controller, systemService } = buildMocks();
    systemService.health.mockResolvedValueOnce({
      ...buildHealthResponse(),
      status: HealthStatus.DOWN,
      database: { status: 'DOWN', latencyMs: null },
    });

    const result = await controller.health();
    expect(result.status).toBe(HealthStatus.DOWN);
    expect(result.database.latencyMs).toBeNull();
  });

  it('returns a DEGRADED status when service reports it', async () => {
    const { controller, systemService } = buildMocks();
    systemService.health.mockResolvedValueOnce({
      ...buildHealthResponse(),
      status: HealthStatus.DEGRADED,
      database: { status: 'UP', latencyMs: 750 },
    });

    const result = await controller.health();
    expect(result.status).toBe(HealthStatus.DEGRADED);
  });
});

// ─── GET /system/info ─────────────────────────────────────────────────────────

describe('SystemController.info()', () => {
  it('delegates to systemService.info()', () => {
    const { controller, systemService } = buildMocks();

    controller.info();

    expect(systemService.info).toHaveBeenCalledTimes(1);
  });

  it('returns the service info response', () => {
    const { controller } = buildMocks();

    const result = controller.info();

    expect(result.appName).toBe('sigp-backend-v1');
    expect(result.nodeVersion).toBe('v20.11.0');
    expect(result.nestVersion).toBe('^11.0.5');
    expect(result.prismaVersion).toBe('^6.0.0');
    expect(result.timezone).toBe('Africa/Dakar');
    expect(result.architecture).toBe('x64');
  });

  it('propagates service errors', () => {
    const { controller, systemService } = buildMocks();
    systemService.info.mockImplementationOnce(() => {
      throw new Error('Info error');
    });

    expect(() => controller.info()).toThrow('Info error');
  });
});

// ─── GET /system/stats ────────────────────────────────────────────────────────

describe('SystemController.stats()', () => {
  it('delegates to systemService.stats()', () => {
    const { controller, systemService } = buildMocks();

    controller.stats();

    expect(systemService.stats).toHaveBeenCalledTimes(1);
  });

  it('returns the service stats response', () => {
    const { controller } = buildMocks();

    const result = controller.stats();

    expect(result.cpu.cores).toBe(12);
    expect(result.memoryTotalMb).toBe(16384);
    expect(result.heapUsedMb).toBe(64);
    expect(result.pid).toBe(12345);
    expect(result.modulesCount).toBe(38);
    expect(result.uptimeFormatted).toBe('1h 0s');
  });

  it('propagates service errors', () => {
    const { controller, systemService } = buildMocks();
    systemService.stats.mockImplementationOnce(() => {
      throw new Error('Stats error');
    });

    expect(() => controller.stats()).toThrow('Stats error');
  });
});
