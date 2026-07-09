import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ExportQueryDto, ExportFormat, ExportResource } from './dto/export-query.dto';
import { ExportResponseDto } from './dto/export-response.dto';

async function errorsFor<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance);
  return errors.map((e) => e.property);
}

// ─── ExportResource enum ──────────────────────────────────────────────────────

describe('ExportResource enum', () => {
  it('has 15 values', () => {
    expect(Object.values(ExportResource)).toHaveLength(15);
  });

  it('contains all expected resources', () => {
    const values = Object.values(ExportResource);
    expect(values).toContain('projects');
    expect(values).toContain('ptba');
    expect(values).toContain('budget-lines');
    expect(values).toContain('budget-versions');
    expect(values).toContain('journal');
    expect(values).toContain('funding-sources');
    expect(values).toContain('disbursements');
    expect(values).toContain('contracts');
    expect(values).toContain('ppm');
    expect(values).toContain('ppm-etapes');
    expect(values).toContain('risques');
    expect(values).toContain('livrables');
    expect(values).toContain('documents');
    expect(values).toContain('reports');
    expect(values).toContain('notifications');
  });
});

// ─── ExportFormat enum ────────────────────────────────────────────────────────

describe('ExportFormat enum', () => {
  it('has 3 values', () => {
    expect(Object.values(ExportFormat)).toHaveLength(3);
  });

  it('contains pdf, excel, csv', () => {
    expect(Object.values(ExportFormat)).toContain('pdf');
    expect(Object.values(ExportFormat)).toContain('excel');
    expect(Object.values(ExportFormat)).toContain('csv');
  });
});

// ─── ExportQueryDto validation ────────────────────────────────────────────────

describe('ExportQueryDto validation', () => {
  it('accepts a valid minimal payload (resource + format)', async () => {
    const errors = await errorsFor(ExportQueryDto, {
      resource: 'projects',
      format: 'pdf',
    });
    expect(errors).toEqual([]);
  });

  it('accepts a fully populated payload', async () => {
    const errors = await errorsFor(ExportQueryDto, {
      resource: 'risques',
      format: 'excel',
      projectId: 'a1b2c3d4-0000-4000-8000-ef1234567890',
      search: 'inondation',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });
    expect(errors).toEqual([]);
  });

  it('rejects a missing resource', async () => {
    expect(await errorsFor(ExportQueryDto, { format: 'csv' })).toContain('resource');
  });

  it('rejects an invalid resource', async () => {
    expect(
      await errorsFor(ExportQueryDto, { resource: 'unknown-module', format: 'pdf' }),
    ).toContain('resource');
  });

  it('rejects a missing format', async () => {
    expect(await errorsFor(ExportQueryDto, { resource: 'projects' })).toContain('format');
  });

  it('rejects an invalid format', async () => {
    expect(await errorsFor(ExportQueryDto, { resource: 'projects', format: 'word' })).toContain(
      'format',
    );
  });

  it('rejects an invalid projectId (not UUID)', async () => {
    expect(
      await errorsFor(ExportQueryDto, {
        resource: 'projects',
        format: 'csv',
        projectId: 'not-a-uuid',
      }),
    ).toContain('projectId');
  });

  it('accepts a valid projectId', async () => {
    expect(
      await errorsFor(ExportQueryDto, {
        resource: 'documents',
        format: 'csv',
        projectId: 'a1b2c3d4-0000-4000-8000-ef1234567890',
      }),
    ).toEqual([]);
  });

  it('rejects an invalid dateFrom', async () => {
    expect(
      await errorsFor(ExportQueryDto, {
        resource: 'projects',
        format: 'pdf',
        dateFrom: 'not-a-date',
      }),
    ).toContain('dateFrom');
  });

  it('rejects an invalid dateTo', async () => {
    expect(
      await errorsFor(ExportQueryDto, {
        resource: 'projects',
        format: 'pdf',
        dateTo: '31-12-2026',
      }),
    ).toContain('dateTo');
  });

  it('accepts valid ISO 8601 dates', async () => {
    expect(
      await errorsFor(ExportQueryDto, {
        resource: 'reports',
        format: 'excel',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      }),
    ).toEqual([]);
  });

  it('accepts all valid resource values', async () => {
    for (const resource of Object.values(ExportResource)) {
      const errors = await errorsFor(ExportQueryDto, { resource, format: 'csv' });
      expect(errors).toEqual([]);
    }
  });

  it('accepts all valid format values', async () => {
    for (const format of Object.values(ExportFormat)) {
      const errors = await errorsFor(ExportQueryDto, { resource: 'projects', format });
      expect(errors).toEqual([]);
    }
  });
});

// ─── ExportResponseDto ────────────────────────────────────────────────────────

describe('ExportResponseDto', () => {
  const now = new Date('2026-07-08T10:00:00.000Z');

  it('accepts a fully populated response', () => {
    const dto: ExportResponseDto = {
      filename: 'sigp-projects-2026-07-08.pdf',
      format: 'pdf',
      resource: 'projects',
      records: 42,
      estimatedSizeKb: 84,
      generatedAt: now,
      downloadUrl: '/api/v1/exports/download?resource=projects&format=pdf',
    };

    expect(dto.filename).toBe('sigp-projects-2026-07-08.pdf');
    expect(dto.format).toBe('pdf');
    expect(dto.resource).toBe('projects');
    expect(dto.records).toBe(42);
    expect(dto.estimatedSizeKb).toBe(84);
    expect(dto.generatedAt).toBe(now);
    expect(dto.downloadUrl).toContain('/api/v1/exports/download');
  });

  it('records can be 0 for an empty export', () => {
    const dto: ExportResponseDto = {
      filename: 'sigp-risques-2026-07-08.csv',
      format: 'csv',
      resource: 'risques',
      records: 0,
      estimatedSizeKb: 1,
      generatedAt: now,
      downloadUrl: '/api/v1/exports/download?resource=risques&format=csv',
    };

    expect(dto.records).toBe(0);
    expect(dto.estimatedSizeKb).toBe(1);
  });

  it('filename follows the sigp-{resource}-{date}.{ext} pattern', () => {
    const dto: ExportResponseDto = {
      filename: 'sigp-ppm-2026-07-08.xlsx',
      format: 'excel',
      resource: 'ppm',
      records: 10,
      estimatedSizeKb: 10,
      generatedAt: now,
      downloadUrl: '/api/v1/exports/download?resource=ppm&format=excel',
    };

    expect(dto.filename).toMatch(/^sigp-.+-\d{4}-\d{2}-\d{2}\.(pdf|xlsx|csv)$/);
  });
});
