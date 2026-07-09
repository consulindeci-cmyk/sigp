import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportQueryDto, ExportFormat, ExportResource } from './dto/export-query.dto';
import { ExportResponseDto } from './dto/export-response.dto';

function buildResponse(resource = 'projects', format = 'pdf'): ExportResponseDto {
  return {
    filename: `sigp-${resource}-2026-07-08.${format === 'excel' ? 'xlsx' : format}`,
    format,
    resource,
    records: 42,
    estimatedSizeKb: 84,
    generatedAt: new Date('2026-07-08T10:00:00.000Z'),
    downloadUrl: `/api/v1/exports/download?resource=${resource}&format=${format}`,
  };
}

function buildMocks() {
  const exportService = {
    export: jest.fn().mockResolvedValue(buildResponse()),
    download: jest.fn().mockResolvedValue(buildResponse()),
  } as unknown as jest.Mocked<ExportService>;

  const controller = new ExportController(exportService);
  return { controller, exportService };
}

function queryDto(
  resource: ExportResource,
  format: ExportFormat,
  extra?: Partial<ExportQueryDto>,
): ExportQueryDto {
  return Object.assign(new ExportQueryDto(), { resource, format, ...extra });
}

// ─── GET /exports ─────────────────────────────────────────────────────────────

describe('ExportController.export()', () => {
  it('delegates to exportService.export() with the query DTO', async () => {
    const { controller, exportService } = buildMocks();
    const dto = queryDto(ExportResource.PROJECTS, ExportFormat.PDF);

    await controller.export(dto);

    expect(exportService.export).toHaveBeenCalledWith(dto);
  });

  it('returns the service response', async () => {
    const { controller } = buildMocks();
    const dto = queryDto(ExportResource.RISQUES, ExportFormat.CSV);

    const result = await controller.export(dto);

    expect(result.records).toBe(42);
    expect(result.format).toBe('pdf');
    expect(result.filename).toContain('sigp-');
  });

  it('propagates optional filters to the service', async () => {
    const { controller, exportService } = buildMocks();
    const pid = 'a1b2c3d4-0000-4000-8000-ef1234567890';
    const dto = queryDto(ExportResource.PPM, ExportFormat.EXCEL, {
      projectId: pid,
      search: 'marché',
    });

    await controller.export(dto);

    expect(exportService.export).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: pid, search: 'marché' }),
    );
  });

  it('propagates service errors', async () => {
    const { controller, exportService } = buildMocks();
    exportService.export.mockRejectedValueOnce(new Error('Service error'));
    const dto = queryDto(ExportResource.DOCUMENTS, ExportFormat.PDF);

    await expect(controller.export(dto)).rejects.toThrow('Service error');
  });
});

// ─── GET /exports/download ────────────────────────────────────────────────────

describe('ExportController.download()', () => {
  it('delegates to exportService.download() with the query DTO', async () => {
    const { controller, exportService } = buildMocks();
    const dto = queryDto(ExportResource.LIVRABLES, ExportFormat.CSV);

    await controller.download(dto);

    expect(exportService.download).toHaveBeenCalledWith(dto);
  });

  it('returns the download service response', async () => {
    const { controller } = buildMocks();
    const dto = queryDto(ExportResource.REPORTS, ExportFormat.EXCEL);

    const result = await controller.download(dto);

    expect(result).toBeDefined();
    expect(result.downloadUrl).toContain('/api/v1/exports/download');
  });

  it('passes date filters to the service', async () => {
    const { controller, exportService } = buildMocks();
    const dto = queryDto(ExportResource.NOTIFICATIONS, ExportFormat.PDF, {
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });

    await controller.download(dto);

    expect(exportService.download).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: '2026-01-01', dateTo: '2026-12-31' }),
    );
  });

  it('propagates service errors', async () => {
    const { controller, exportService } = buildMocks();
    exportService.download.mockRejectedValueOnce(new Error('Download error'));
    const dto = queryDto(ExportResource.PTBA, ExportFormat.CSV);

    await expect(controller.download(dto)).rejects.toThrow('Download error');
  });
});
