import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExportService } from './export.service';
import { ExportQueryDto, ExportFormat, ExportResource } from './dto/export-query.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePaginated(total: number) {
  return {
    data: [],
    meta: {
      total,
      page: 1,
      limit: 1,
      totalPages: total,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

function buildMocks() {
  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const makeService = (total = 5) => ({
    findAll: jest.fn().mockResolvedValue(makePaginated(total)),
  });

  const projectService = makeService(10);
  const ptbaService = makeService(8);
  const budgetVersionService = makeService(3);
  const budgetLineService = makeService(20);
  const journalService = makeService(15);
  const fundingSourceService = makeService(4);
  const disbursementService = makeService(7);
  const contractService = makeService(6);
  const ppmService = makeService(9);
  const ppmEtapeService = makeService(12);
  const risqueService = makeService(5);
  const livrableService = makeService(11);
  const documentService = makeService(13);
  const reportService = makeService(2);
  const notificationService = makeService(30);

  const service = new ExportService(
    eventEmitter,
    projectService as unknown,
    ptbaService as unknown,
    budgetVersionService as unknown,
    budgetLineService as unknown,
    journalService as unknown,
    fundingSourceService as unknown,
    disbursementService as unknown,
    contractService as unknown,
    ppmService as unknown,
    ppmEtapeService as unknown,
    risqueService as unknown,
    livrableService as unknown,
    documentService as unknown,
    reportService as unknown,
    notificationService as unknown,
  );

  return {
    service,
    eventEmitter,
    projectService,
    ptbaService,
    budgetVersionService,
    budgetLineService,
    journalService,
    fundingSourceService,
    disbursementService,
    contractService,
    ppmService,
    ppmEtapeService,
    risqueService,
    livrableService,
    documentService,
    reportService,
    notificationService,
  };
}

function query(
  resource: ExportResource,
  format: ExportFormat,
  extra?: Partial<ExportQueryDto>,
): ExportQueryDto {
  return Object.assign(new ExportQueryDto(), { resource, format, ...extra });
}

// ─── export() ─────────────────────────────────────────────────────────────────

describe('ExportService.export()', () => {
  it('returns a valid ExportResponseDto for projects/pdf', async () => {
    const { service } = buildMocks();
    const result = await service.export(query(ExportResource.PROJECTS, ExportFormat.PDF));

    expect(result.resource).toBe('projects');
    expect(result.format).toBe('pdf');
    expect(result.records).toBe(10);
    expect(result.filename).toMatch(/^sigp-projects-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(result.estimatedSizeKb).toBeGreaterThanOrEqual(1);
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.downloadUrl).toContain('/api/v1/exports/download');
  });

  it('uses .xlsx extension for excel format', async () => {
    const { service } = buildMocks();
    const result = await service.export(query(ExportResource.REPORTS, ExportFormat.EXCEL));
    expect(result.filename).toMatch(/\.xlsx$/);
  });

  it('uses .csv extension for csv format', async () => {
    const { service } = buildMocks();
    const result = await service.export(query(ExportResource.RISQUES, ExportFormat.CSV));
    expect(result.filename).toMatch(/\.csv$/);
  });

  it('uses .pdf extension for pdf format', async () => {
    const { service } = buildMocks();
    const result = await service.export(query(ExportResource.PPM, ExportFormat.PDF));
    expect(result.filename).toMatch(/\.pdf$/);
  });

  it('estimatedSizeKb is at least 1 even for 0 records', async () => {
    const { service, projectService } = buildMocks();
    projectService.findAll.mockResolvedValue(makePaginated(0));
    const result = await service.export(query(ExportResource.PROJECTS, ExportFormat.PDF));
    expect(result.estimatedSizeKb).toBeGreaterThanOrEqual(1);
  });

  it('estimatedSizeKb is larger for PDF than CSV', async () => {
    const mocks = buildMocks();
    const csv = await mocks.service.export(query(ExportResource.PROJECTS, ExportFormat.CSV));
    const mocks2 = buildMocks();
    const pdf = await mocks2.service.export(query(ExportResource.PROJECTS, ExportFormat.PDF));
    expect(pdf.estimatedSizeKb).toBeGreaterThan(csv.estimatedSizeKb);
  });

  it('downloadUrl contains resource and format', async () => {
    const { service } = buildMocks();
    const result = await service.export(query(ExportResource.LIVRABLES, ExportFormat.EXCEL));
    expect(result.downloadUrl).toContain('resource=livrables');
    expect(result.downloadUrl).toContain('format=excel');
  });

  it('emits EXPORT_GENERATED event via setImmediate', async () => {
    const { service, eventEmitter } = buildMocks();
    await service.export(query(ExportResource.DOCUMENTS, ExportFormat.CSV));
    // Flush the setImmediate queue
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'export.generated',
      expect.objectContaining({
        resource: 'documents',
        format: 'csv',
        records: expect.any(Number),
        filename: expect.stringContaining('sigp-documents'),
        generatedAt: expect.any(Date),
      }),
    );
  });
});

// ─── download() ───────────────────────────────────────────────────────────────

describe('ExportService.download()', () => {
  it('returns the same structure as export()', async () => {
    const { service } = buildMocks();
    const q = query(ExportResource.PPM, ExportFormat.CSV);
    const exportResult = await service.export(q);
    const downloadResult = await service.download(q);

    expect(downloadResult.resource).toBe(exportResult.resource);
    expect(downloadResult.format).toBe(exportResult.format);
    expect(downloadResult.records).toBe(exportResult.records);
    expect(downloadResult.estimatedSizeKb).toBe(exportResult.estimatedSizeKb);
    expect(downloadResult.filename).toMatch(/^sigp-ppm-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(exportResult.filename).toMatch(/^sigp-ppm-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('downloadUrl points to /api/v1/exports/download', async () => {
    const { service } = buildMocks();
    const result = await service.download(query(ExportResource.NOTIFICATIONS, ExportFormat.PDF));
    expect(result.downloadUrl).toContain('/api/v1/exports/download');
  });
});

// ─── fetchCount per resource ───────────────────────────────────────────────────

describe('ExportService — resource routing', () => {
  const cases: [ExportResource, string][] = [
    [ExportResource.PROJECTS, 'projectService'],
    [ExportResource.PTBA, 'ptbaService'],
    [ExportResource.BUDGET_VERSIONS, 'budgetVersionService'],
    [ExportResource.BUDGET_LINES, 'budgetLineService'],
    [ExportResource.JOURNAL, 'journalService'],
    [ExportResource.FUNDING_SOURCES, 'fundingSourceService'],
    [ExportResource.DISBURSEMENTS, 'disbursementService'],
    [ExportResource.CONTRACTS, 'contractService'],
    [ExportResource.PPM, 'ppmService'],
    [ExportResource.PPM_ETAPES, 'ppmEtapeService'],
    [ExportResource.RISQUES, 'risqueService'],
    [ExportResource.LIVRABLES, 'livrableService'],
    [ExportResource.DOCUMENTS, 'documentService'],
    [ExportResource.REPORTS, 'reportService'],
    [ExportResource.NOTIFICATIONS, 'notificationService'],
  ];

  it.each(cases)('calls %s → %s.findAll()', async (resource, serviceName) => {
    const mocks = buildMocks();
    await mocks.service.export(query(resource, ExportFormat.CSV));
    expect((mocks as unknown)[serviceName].findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 1 }),
    );
  });
});

// ─── filter propagation ───────────────────────────────────────────────────────

describe('ExportService — filter propagation', () => {
  it('passes search to service when provided', async () => {
    const { service, ptbaService } = buildMocks();
    await service.export(query(ExportResource.PTBA, ExportFormat.CSV, { search: 'formation' }));
    expect(ptbaService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'formation' }),
    );
  });

  it('passes projectId to service when supported and provided', async () => {
    const { service, ppmService } = buildMocks();
    const pid = 'a1b2c3d4-0000-4000-8000-ef1234567890';
    await service.export(query(ExportResource.PPM, ExportFormat.PDF, { projectId: pid }));
    expect(ppmService.findAll).toHaveBeenCalledWith(expect.objectContaining({ projectId: pid }));
  });

  it('does not pass projectId to services that do not support it (budget-lines)', async () => {
    const { service, budgetLineService } = buildMocks();
    const pid = 'a1b2c3d4-0000-4000-8000-ef1234567890';
    await service.export(query(ExportResource.BUDGET_LINES, ExportFormat.CSV, { projectId: pid }));
    const call = budgetLineService.findAll.mock.calls[0][0] as Record<string, unknown>;
    expect(call['projectId']).toBeUndefined();
  });

  it('omits search when not provided', async () => {
    const { service, contractService } = buildMocks();
    await service.export(query(ExportResource.CONTRACTS, ExportFormat.EXCEL));
    const call = contractService.findAll.mock.calls[0][0] as Record<string, unknown>;
    expect(call['search']).toBeUndefined();
  });
});

// ─── filename pattern ─────────────────────────────────────────────────────────

describe('ExportService — filename', () => {
  it('filename pattern is sigp-{resource}-{YYYY-MM-DD}.{ext}', async () => {
    const { service } = buildMocks();
    const result = await service.export(query(ExportResource.RISQUES, ExportFormat.PDF));
    expect(result.filename).toMatch(/^sigp-risques-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('filename contains the ISO date of generation', async () => {
    const { service } = buildMocks();
    const before = new Date();
    const result = await service.export(query(ExportResource.CONTRACTS, ExportFormat.CSV));
    const dateStr = before.toISOString().split('T')[0];
    expect(result.filename).toContain(dateStr);
  });
});

// ─── estimated size ───────────────────────────────────────────────────────────

describe('ExportService — estimatedSizeKb', () => {
  it('is always at least 1 KB', async () => {
    const { service, reportService } = buildMocks();
    reportService.findAll.mockResolvedValue(makePaginated(0));
    const result = await service.export(query(ExportResource.REPORTS, ExportFormat.PDF));
    expect(result.estimatedSizeKb).toBeGreaterThanOrEqual(1);
  });

  it('grows proportionally with record count', async () => {
    const { service: s1, livrableService: ls1 } = buildMocks();
    ls1.findAll.mockResolvedValue(makePaginated(10));
    const r1 = await s1.export(query(ExportResource.LIVRABLES, ExportFormat.CSV));

    const { service: s2, livrableService: ls2 } = buildMocks();
    ls2.findAll.mockResolvedValue(makePaginated(100));
    const r2 = await s2.export(query(ExportResource.LIVRABLES, ExportFormat.CSV));

    expect(r2.estimatedSizeKb).toBeGreaterThan(r1.estimatedSizeKb);
  });

  it('PDF is larger than EXCEL which is larger than CSV for same records', async () => {
    const getSize = async (format: ExportFormat) => {
      const { service, documentService } = buildMocks();
      documentService.findAll.mockResolvedValue(makePaginated(50));
      const r = await service.export(query(ExportResource.DOCUMENTS, format));
      return r.estimatedSizeKb;
    };

    const csv = await getSize(ExportFormat.CSV);
    const excel = await getSize(ExportFormat.EXCEL);
    const pdf = await getSize(ExportFormat.PDF);

    expect(pdf).toBeGreaterThan(excel);
    expect(excel).toBeGreaterThan(csv);
  });
});
