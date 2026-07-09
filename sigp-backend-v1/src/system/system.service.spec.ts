import * as os from 'os';
import { SystemService } from './system.service';
import { HealthStatus } from './dto/health-response.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPrismaMock(queryResult: 'ok' | 'slow' | 'error' = 'ok') {
  return {
    $queryRaw: jest.fn().mockImplementation(() => {
      if (queryResult === 'error') return Promise.reject(new Error('DB error'));
      if (queryResult === 'slow') {
        return new Promise((resolve) => setTimeout(resolve, 0));
      }
      return Promise.resolve([{ '?column?': 1 }]);
    }),
  };
}

function buildService(dbMode: 'ok' | 'slow' | 'error' = 'ok') {
  const prisma = buildPrismaMock(dbMode);
  const service = new SystemService(prisma as unknown);
  return { service, prisma };
}

// ─── health() ─────────────────────────────────────────────────────────────────

describe('SystemService.health()', () => {
  it('returns UP status when DB is reachable', async () => {
    const { service } = buildService('ok');
    const result = await service.health();

    expect(result.status).toBe(HealthStatus.UP);
    expect(result.database.status).toBe('UP');
    expect(result.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns DOWN status when DB throws', async () => {
    const { service } = buildService('error');
    const result = await service.health();

    expect(result.status).toBe(HealthStatus.DOWN);
    expect(result.database.status).toBe('DOWN');
    expect(result.database.latencyMs).toBeNull();
  });

  it('includes uptime as a non-negative integer', async () => {
    const { service } = buildService();
    const result = await service.health();

    expect(result.uptime).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.uptime)).toBe(true);
  });

  it('includes a valid timestamp', async () => {
    const { service } = buildService();
    const before = new Date();
    const result = await service.health();
    const after = new Date();

    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('includes the application version', async () => {
    const { service } = buildService();
    const result = await service.health();

    expect(typeof result.version).toBe('string');
    expect(result.version.length).toBeGreaterThan(0);
  });

  it('includes the Node.js version', async () => {
    const { service } = buildService();
    const result = await service.health();

    expect(result.node).toBe(process.version);
    expect(result.node).toMatch(/^v\d+\.\d+\.\d+/);
  });

  it('includes memory stats with positive totalMb', async () => {
    const { service } = buildService();
    const result = await service.health();

    expect(result.memory.totalMb).toBeGreaterThan(0);
    expect(result.memory.usedMb).toBeGreaterThanOrEqual(0);
    expect(result.memory.percentUsed).toBeGreaterThanOrEqual(0);
    expect(result.memory.percentUsed).toBeLessThanOrEqual(100);
  });

  it('includes environment from NODE_ENV', async () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'test';
    const { service } = buildService();
    const result = await service.health();
    process.env['NODE_ENV'] = originalEnv;

    expect(result.environment).toBeDefined();
  });

  it('DEGRADED status when DB latency exceeds 500ms', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockImplementation(async () => {
        // simulate high latency by mocking Date.now to return a large diff
        return Promise.resolve([]);
      }),
    };
    const service = new SystemService(prisma as unknown);

    // Spy Date.now to simulate high latency
    let callCount = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => {
      callCount++;
      if (callCount === 1) return 1000;
      return 1000 + 600; // 600ms latency
    });

    const result = await service.health();
    jest.spyOn(Date, 'now').mockRestore();

    expect(result.status).toBe(HealthStatus.DEGRADED);
    expect(result.database.latencyMs).toBeGreaterThan(500);
  });
});

// ─── info() ──────────────────────────────────────────────────────────────────

describe('SystemService.info()', () => {
  it('returns a valid SystemInfoDto', () => {
    const { service } = buildService();
    const result = service.info();

    expect(result.appName).toBeTruthy();
    expect(result.version).toBeTruthy();
    expect(result.nodeVersion).toBe(process.version);
    expect(result.nestVersion).toBeTruthy();
    expect(result.prismaVersion).toBeTruthy();
    expect(result.timezone).toBeTruthy();
    expect(result.os).toBeTruthy();
    expect(result.architecture).toBeTruthy();
  });

  it('nodeVersion starts with "v"', () => {
    const { service } = buildService();
    expect(service.info().nodeVersion).toMatch(/^v\d+/);
  });

  it('nestVersion contains "11"', () => {
    const { service } = buildService();
    expect(service.info().nestVersion).toContain('11');
  });

  it('prismaVersion contains "6"', () => {
    const { service } = buildService();
    expect(service.info().prismaVersion).toContain('6');
  });

  it('architecture matches os.arch()', () => {
    const { service } = buildService();
    expect(service.info().architecture).toBe(os.arch());
  });

  it('os field is non-empty', () => {
    const { service } = buildService();
    const result = service.info();
    expect(result.os.length).toBeGreaterThan(0);
    expect(result.os).toContain(os.type());
  });

  it('timezone is a non-empty string', () => {
    const { service } = buildService();
    const result = service.info();
    expect(typeof result.timezone).toBe('string');
    expect(result.timezone.length).toBeGreaterThan(0);
  });
});

// ─── stats() ─────────────────────────────────────────────────────────────────

describe('SystemService.stats()', () => {
  it('returns a valid SystemStatsDto', () => {
    const { service } = buildService();
    const result = service.stats();

    expect(result.cpu).toBeDefined();
    expect(typeof result.cpu.model).toBe('string');
    expect(result.cpu.cores).toBeGreaterThan(0);
    expect(result.memoryUsedMb).toBeGreaterThanOrEqual(0);
    expect(result.memoryTotalMb).toBeGreaterThan(0);
    expect(result.heapUsedMb).toBeGreaterThanOrEqual(0);
    expect(result.heapTotalMb).toBeGreaterThan(0);
    expect(result.pid).toBe(process.pid);
    expect(result.modulesCount).toBeGreaterThanOrEqual(0);
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(typeof result.uptimeFormatted).toBe('string');
  });

  it('pid matches process.pid', () => {
    const { service } = buildService();
    expect(service.stats().pid).toBe(process.pid);
  });

  it('cpu.cores matches os.cpus().length', () => {
    const { service } = buildService();
    expect(service.stats().cpu.cores).toBe(os.cpus().length);
  });

  it('memoryTotalMb matches os.totalmem()', () => {
    const { service } = buildService();
    const expected = Math.round(os.totalmem() / 1024 / 1024);
    expect(service.stats().memoryTotalMb).toBe(expected);
  });

  it('heapUsedMb is less than or equal to heapTotalMb', () => {
    const { service } = buildService();
    const result = service.stats();
    expect(result.heapUsedMb).toBeLessThanOrEqual(result.heapTotalMb);
  });

  it('modulesCount is a non-negative integer', () => {
    const { service } = buildService();
    const count = service.stats().modulesCount;
    expect(count).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(count)).toBe(true);
  });

  it('uptimeFormatted ends with seconds marker', () => {
    const { service } = buildService();
    expect(service.stats().uptimeFormatted).toMatch(/\d+s$/);
  });
});

// ─── formatUptime (via stats) ─────────────────────────────────────────────────

describe('SystemService — formatUptime', () => {
  function getFormattedUptime(service: SystemService, seconds: number): string {
    jest.spyOn(process, 'uptime').mockReturnValue(seconds);
    const result = service.stats().uptimeFormatted;
    jest.spyOn(process, 'uptime').mockRestore();
    return result;
  }

  it('formats 0 seconds as "0s"', () => {
    const { service } = buildService();
    expect(getFormattedUptime(service, 0)).toBe('0s');
  });

  it('formats 61 seconds as "1m 1s"', () => {
    const { service } = buildService();
    expect(getFormattedUptime(service, 61)).toBe('1m 1s');
  });

  it('formats 3661 seconds as "1h 1m 1s"', () => {
    const { service } = buildService();
    expect(getFormattedUptime(service, 3661)).toBe('1h 1m 1s');
  });

  it('formats 90061 seconds as "1d 1h 1m 1s"', () => {
    const { service } = buildService();
    expect(getFormattedUptime(service, 90061)).toBe('1d 1h 1m 1s');
  });

  it('formats 3600 seconds as "1h 0s"', () => {
    const { service } = buildService();
    expect(getFormattedUptime(service, 3600)).toBe('1h 0s');
  });

  it('formats 86400 seconds as "1d 0s"', () => {
    const { service } = buildService();
    expect(getFormattedUptime(service, 86400)).toBe('1d 0s');
  });
});
