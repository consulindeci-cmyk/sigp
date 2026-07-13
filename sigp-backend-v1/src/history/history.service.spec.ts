import { AuditAction } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { HistoryRepository } from './history.repository';
import { HistoryService } from './history.service';
import { HistoryQueryDto } from './dto/history-query.dto';
import { HistoriqueWithRelations } from './dto/history-response.dto';

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';
const USER_ID = 'user-0001-000-0000-000000000000';
const ENTRY_ID = 'hist-0001-000-0000-000000000000';

function buildEntry(overrides: Partial<HistoriqueWithRelations> = {}): HistoriqueWithRelations {
  return {
    id: ENTRY_ID,
    project_id: PROJECT_ID,
    user_id: USER_ID,
    action: AuditAction.CREATE,
    table_cible: 'contracts',
    enregistrement_id: 'ctr-0001-0000-0000-000000000000',
    avant: null,
    apres: { numero: 'CTR-2026-001' },
    ip_address: '192.168.1.10',
    user_agent: 'Chrome 120 / Windows 11',
    created_at: new Date('2026-07-13T08:00:00Z'),
    user: { id: USER_ID, nom: 'Diallo', prenom: 'Amadou', role: 'COORDINATEUR' },
    project: { id: PROJECT_ID, code: 'SIGP-2026', nom: 'Projet Test' },
    ...overrides,
  } as HistoriqueWithRelations;
}

function buildMocks() {
  const historyRepository = {
    findManyPaginated: jest.fn().mockResolvedValue({ entries: [buildEntry()], total: 1 }),
    findById: jest.fn().mockResolvedValue(buildEntry()),
    findDistinctModules: jest.fn().mockResolvedValue(['contracts', 'livrables']),
    countTotal: jest.fn().mockResolvedValue(10),
    countSince: jest.fn().mockResolvedValue(2),
    countByAction: jest.fn().mockResolvedValue([{ action: AuditAction.CREATE, count: 5 }]),
    countByModule: jest.fn().mockResolvedValue([{ module: 'contracts', count: 3 }]),
    dailyVolume: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<HistoryRepository>;

  const service = new HistoryService(historyRepository);
  return { service, historyRepository };
}

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('HistoryService.findAll()', () => {
  it('returns a paginated result with mapped fields', async () => {
    const { service } = buildMocks();
    const result = await service.findAll(new HistoryQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0].id).toBe(ENTRY_ID);
    expect(result.data[0].userNom).toBe('Amadou Diallo');
    expect(result.data[0].moduleLabel).toBe('Contrats');
    expect(result.data[0].elementLabel).toBe('CTR-2026-001');
  });

  it('forwards all query filters to the repository', async () => {
    const { service, historyRepository } = buildMocks();
    const query = Object.assign(new HistoryQueryDto(), {
      projectId: PROJECT_ID,
      userId: USER_ID,
      action: AuditAction.DELETE,
      module: 'contracts',
    });
    await service.findAll(query);

    expect(historyRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        userId: USER_ID,
        action: AuditAction.DELETE,
        module: 'contracts',
      }),
    );
  });

  it('falls back to created_at when sortBy is not whitelisted (anti-injection)', async () => {
    const { service, historyRepository } = buildMocks();
    const query = Object.assign(new HistoryQueryDto(), {
      sortBy: 'user_id; DROP TABLE',
      sortOrder: 'asc',
    });
    await service.findAll(query);

    expect(historyRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (action)', async () => {
    const { service, historyRepository } = buildMocks();
    const query = Object.assign(new HistoryQueryDto(), { sortBy: 'action', sortOrder: 'asc' });
    await service.findAll(query);

    expect(historyRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { action: 'asc' } }),
    );
  });

  it('masks the IP address in the response', async () => {
    const { service } = buildMocks();
    const result = await service.findAll(new HistoryQueryDto());

    expect(result.data[0].ipAddress).toBe('192.168.1.0');
  });
});

// ─── findOne ─────────────────────────────────────────────────────────────────

describe('HistoryService.findOne()', () => {
  it('returns a detailed entry with avant/apres', async () => {
    const { service } = buildMocks();
    const result = await service.findOne(ENTRY_ID);

    expect(result.id).toBe(ENTRY_ID);
    expect((result as any).apres).toEqual({ numero: 'CTR-2026-001' });
  });

  it('throws HISTORY_NOT_FOUND when it does not exist', async () => {
    const { service, historyRepository } = buildMocks();
    historyRepository.findById.mockResolvedValueOnce(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ─── getModules ──────────────────────────────────────────────────────────────

describe('HistoryService.getModules()', () => {
  it('returns real modules with resolved labels', async () => {
    const { service } = buildMocks();
    const result = await service.getModules();

    expect(result).toEqual([
      { module: 'contracts', moduleLabel: 'Contrats' },
      { module: 'livrables', moduleLabel: 'Livrables' },
    ]);
  });
});

// ─── getStats ────────────────────────────────────────────────────────────────

describe('HistoryService.getStats()', () => {
  it('assembles totals, byAction, byModule and a 30-day filled series', async () => {
    const { service } = buildMocks();
    const stats = await service.getStats();

    expect(stats.total).toBe(10);
    expect(stats.totalToday).toBe(2);
    expect(stats.totalThisWeek).toBe(2);
    expect(stats.byAction).toEqual([{ action: AuditAction.CREATE, count: 5 }]);
    expect(stats.byModule).toEqual([{ module: 'contracts', moduleLabel: 'Contrats', count: 3 }]);
    expect(stats.dailyVolume).toHaveLength(30);
  });

  it('scopes stats by projectId when provided', async () => {
    const { service, historyRepository } = buildMocks();
    await service.getStats(PROJECT_ID);

    expect(historyRepository.countTotal).toHaveBeenCalledWith(PROJECT_ID);
    expect(historyRepository.countByAction).toHaveBeenCalledWith({ projectId: PROJECT_ID });
  });

  it('fills days with no recorded events with a zero count', async () => {
    const { service, historyRepository } = buildMocks();
    historyRepository.dailyVolume.mockResolvedValueOnce([]);
    const stats = await service.getStats();

    expect(stats.dailyVolume.every((d) => d.count === 0)).toBe(true);
  });
});

// ─── exportCsv ───────────────────────────────────────────────────────────────

describe('HistoryService.exportCsv()', () => {
  it('generates a CSV with header and one row per entry', async () => {
    const { service } = buildMocks();
    const csv = await service.exportCsv(new HistoryQueryDto());

    const lines = csv.replace('﻿', '').split('\n');
    expect(lines[0]).toContain('Utilisateur');
    expect(lines[1]).toContain('Amadou Diallo');
    expect(lines[1]).toContain('Contrats');
  });

  it('caps the export at 5000 rows via take', async () => {
    const { service, historyRepository } = buildMocks();
    await service.exportCsv(new HistoryQueryDto());

    expect(historyRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5000 }),
    );
  });
});
