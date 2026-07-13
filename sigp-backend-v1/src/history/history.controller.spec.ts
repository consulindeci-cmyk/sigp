import { AuditAction } from '@prisma/client';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { HistoryQueryDto } from './dto/history-query.dto';

const ENTRY_ID = 'hist-0001-000-0000-000000000000';
const PROJECT_ID = 'proj-0001-0000-0000-000000000000';

function buildResponse() {
  return {
    id: ENTRY_ID,
    projectId: PROJECT_ID,
    projectCode: 'SIGP-2026',
    projectNom: 'Projet Test',
    userId: 'user-0001-000-0000-000000000000',
    userNom: 'Amadou Diallo',
    userRole: 'COORDINATEUR',
    action: AuditAction.CREATE,
    module: 'contracts',
    moduleLabel: 'Contrats',
    enregistrementId: 'ctr-0001-0000-0000-000000000000',
    elementLabel: 'CTR-2026-001',
    ipAddress: '192.168.1.0',
    userAgent: 'Chrome 120 / Windows 11',
    createdAt: new Date('2026-07-13T08:00:00Z'),
  };
}

function buildMocks() {
  const historyService = {
    findAll: jest.fn().mockResolvedValue({
      data: [buildResponse()],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    }),
    findOne: jest.fn().mockResolvedValue({ ...buildResponse(), avant: null, apres: {} }),
    getModules: jest.fn().mockResolvedValue([{ module: 'contracts', moduleLabel: 'Contrats' }]),
    getStats: jest.fn().mockResolvedValue({
      total: 10,
      totalToday: 2,
      totalThisWeek: 5,
      byAction: [],
      byModule: [],
      dailyVolume: [],
    }),
    exportCsv: jest.fn().mockResolvedValue('col1;col2\nval1;val2'),
  } as unknown as jest.Mocked<HistoryService>;

  const controller = new HistoryController(historyService);
  return { controller, historyService };
}

describe('HistoryController', () => {
  it('findAll() delegates to service', async () => {
    const { controller, historyService } = buildMocks();
    const result = await controller.findAll(new HistoryQueryDto());

    expect(historyService.findAll).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
  });

  it('findOne() delegates to service', async () => {
    const { controller, historyService } = buildMocks();
    const result = await controller.findOne(ENTRY_ID);

    expect(historyService.findOne).toHaveBeenCalledWith(ENTRY_ID);
    expect(result.id).toBe(ENTRY_ID);
  });

  it('getModules() delegates to service', async () => {
    const { controller, historyService } = buildMocks();
    const result = await controller.getModules();

    expect(historyService.getModules).toHaveBeenCalled();
    expect(result).toEqual([{ module: 'contracts', moduleLabel: 'Contrats' }]);
  });

  it('getStats() forwards the optional projectId', async () => {
    const { controller, historyService } = buildMocks();
    await controller.getStats(PROJECT_ID);

    expect(historyService.getStats).toHaveBeenCalledWith(PROJECT_ID);
  });

  it('exportCsv() writes CSV content via res.send()', async () => {
    const { controller, historyService } = buildMocks();
    const res = { send: jest.fn() } as any;

    await controller.exportCsv(new HistoryQueryDto(), res);

    expect(historyService.exportCsv).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith('col1;col2\nval1;val2');
  });
});
