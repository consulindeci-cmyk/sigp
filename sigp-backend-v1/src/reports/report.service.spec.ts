import {
  AuditAction,
  FormatRapport,
  RapportProjet,
  StatutRapport,
  TypeRapport,
} from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { ReportRepository } from './report.repository';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';
const REPORT_ID = 'rpt-00001-000-0000-000000000000';

function buildReport(overrides: Partial<RapportProjet> = {}): RapportProjet {
  return {
    id: REPORT_ID,
    project_id: PROJECT_ID,
    code_rapport: 'RPT-001',
    titre: 'Rapport mensuel — Janvier 2026',
    description: null,
    type: TypeRapport.MENSUEL,
    format: FormatRapport.PDF,
    statut: StatutRapport.GENERE,
    periode: 'Janvier 2026',
    date_generation: new Date('2026-01-31'),
    date_telechargement: null,
    version: '1.0',
    auteur: 'Amadou Diallo',
    taille_ko: 3200,
    nb_telechargements: 0,
    commentaires: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-31T00:00:00Z'),
    updated_at: new Date('2026-01-31T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const reportRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ReportRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJECT_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new ReportService(reportRepository, projectService, auditService, eventEmitter);

  return { service, reportRepository, projectService, auditService, eventEmitter };
}

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('ReportService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.reportRepository.findManyPaginated.mockResolvedValue({
      reports: [buildReport()],
      total: 1,
    });
  });

  it('returns a paginated result with mapped fields', async () => {
    const result = await mocks.service.findAll(new ReportQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0].projectId).toBe(PROJECT_ID);
    expect(result.data[0].titre).toBe('Rapport mensuel — Janvier 2026');
    expect(result.data[0].statut).toBe(StatutRapport.GENERE);
  });

  it('forwards all query filters to the repository', async () => {
    const query = Object.assign(new ReportQueryDto(), {
      projectId: PROJECT_ID,
      type: TypeRapport.MENSUEL,
      statut: StatutRapport.VALIDE,
    });
    await mocks.service.findAll(query);

    expect(mocks.reportRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        type: TypeRapport.MENSUEL,
        statut: StatutRapport.VALIDE,
      }),
    );
  });

  it('falls back to created_at when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new ReportQueryDto(), {
      sortBy: 'project_id; DROP TABLE',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.reportRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (titre)', async () => {
    const query = Object.assign(new ReportQueryDto(), { sortBy: 'titre', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.reportRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { titre: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (date_generation)', async () => {
    const query = Object.assign(new ReportQueryDto(), {
      sortBy: 'date_generation',
      sortOrder: 'desc',
    });
    await mocks.service.findAll(query);

    expect(mocks.reportRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { date_generation: 'desc' } }),
    );
  });

  it('honours whitelisted sort field (auteur)', async () => {
    const query = Object.assign(new ReportQueryDto(), { sortBy: 'auteur', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.reportRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { auteur: 'asc' } }),
    );
  });
});

// ─── findOne ─────────────────────────────────────────────────────────────────

describe('ReportService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a ReportResponseDto for an existing report', async () => {
    mocks.reportRepository.findById.mockResolvedValue(buildReport());

    const result = await mocks.service.findOne(REPORT_ID);

    expect(result.id).toBe(REPORT_ID);
    expect(result.projectId).toBe(PROJECT_ID);
    expect(result.codeRapport).toBe('RPT-001');
  });

  it('throws REPORT_NOT_FOUND when it does not exist', async () => {
    mocks.reportRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.REPORT_NOT_FOUND,
    });
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('ReportService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.reportRepository.create.mockResolvedValue(buildReport());
  });

  it('creates a report after validating the project', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      codeRapport: 'RPT-001',
      titre: 'Rapport mensuel',
      type: TypeRapport.MENSUEL,
      format: FormatRapport.PDF,
      periode: 'Janvier 2026',
      dateGeneration: '2026-01-31',
      version: '1.0',
      auteur: 'Amadou Diallo',
    });

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJECT_ID);
    expect(mocks.reportRepository.create).toHaveBeenCalled();
  });

  it('throws 404 when projectId does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(
      mocks.service.create({
        projectId: PROJECT_ID,
        codeRapport: 'RPT-001',
        titre: 'Rapport',
        type: TypeRapport.MENSUEL,
        format: FormatRapport.PDF,
        periode: 'Janvier 2026',
        dateGeneration: '2026-01-31',
        version: '1.0',
        auteur: 'Amadou Diallo',
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PROJECT_NOT_FOUND });
    expect(mocks.reportRepository.create).not.toHaveBeenCalled();
  });

  it('converts dateGeneration string to Date', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      codeRapport: 'RPT-001',
      titre: 'Rapport',
      type: TypeRapport.MENSUEL,
      format: FormatRapport.PDF,
      periode: 'Janvier 2026',
      dateGeneration: '2026-01-31',
      version: '1.0',
      auteur: 'Amadou Diallo',
    });

    expect(mocks.reportRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ dateGeneration: expect.any(Date) }),
    );
  });

  it('passes null dateTelechargement when not provided', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      codeRapport: 'RPT-001',
      titre: 'Rapport',
      type: TypeRapport.MENSUEL,
      format: FormatRapport.PDF,
      periode: 'Janvier 2026',
      dateGeneration: '2026-01-31',
      version: '1.0',
      auteur: 'Amadou Diallo',
    });

    expect(mocks.reportRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ dateTelechargement: null }),
    );
  });

  it('writes a CREATE audit log and emits REPORT_CREATED', async () => {
    await mocks.service.create(
      {
        projectId: PROJECT_ID,
        codeRapport: 'RPT-001',
        titre: 'Rapport',
        type: TypeRapport.MENSUEL,
        format: FormatRapport.PDF,
        periode: 'Janvier 2026',
        dateGeneration: '2026-01-31',
        version: '1.0',
        auteur: 'Amadou Diallo',
      },
      { userId: 'admin-1', ip: '127.0.0.1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'rapports_projet',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.REPORT_CREATED,
      expect.objectContaining({ reportId: REPORT_ID }),
    );
  });

  it('passes createdBy from actor userId', async () => {
    await mocks.service.create(
      {
        projectId: PROJECT_ID,
        codeRapport: 'RPT-001',
        titre: 'Rapport',
        type: TypeRapport.MENSUEL,
        format: FormatRapport.PDF,
        periode: 'Janvier 2026',
        dateGeneration: '2026-01-31',
        version: '1.0',
        auteur: 'Amadou Diallo',
      },
      { userId: 'admin-1' },
    );

    expect(mocks.reportRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'admin-1' }),
    );
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('ReportService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.reportRepository.findById.mockResolvedValue(buildReport());
    mocks.reportRepository.update.mockResolvedValue(buildReport({ statut: StatutRapport.VALIDE }));
  });

  it('throws REPORT_NOT_FOUND when it does not exist', async () => {
    mocks.reportRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('writes an UPDATE audit log with avant/apres and emits REPORT_UPDATED', async () => {
    await mocks.service.update(REPORT_ID, { statut: StatutRapport.VALIDE }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'rapports_projet',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.REPORT_UPDATED, {
      reportId: REPORT_ID,
    });
  });

  it('converts dateGeneration string to Date on update', async () => {
    await mocks.service.update(REPORT_ID, { dateGeneration: '2026-02-28' });

    expect(mocks.reportRepository.update).toHaveBeenCalledWith(
      REPORT_ID,
      expect.objectContaining({ dateGeneration: expect.any(Date) }),
    );
  });

  it('passes updatedBy from actor userId', async () => {
    await mocks.service.update(REPORT_ID, { titre: 'Updated' }, { userId: 'admin-1' });

    expect(mocks.reportRepository.update).toHaveBeenCalledWith(
      REPORT_ID,
      expect.objectContaining({ updatedBy: 'admin-1' }),
    );
  });
});

// ─── remove ──────────────────────────────────────────────────────────────────

describe('ReportService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.reportRepository.findById.mockResolvedValue(buildReport());
  });

  it('throws REPORT_NOT_FOUND when it does not exist', async () => {
    mocks.reportRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.reportRepository.softDelete).not.toHaveBeenCalled();
  });

  it('soft-deletes the report via the repository', async () => {
    await mocks.service.remove(REPORT_ID);

    expect(mocks.reportRepository.softDelete).toHaveBeenCalledWith(REPORT_ID);
  });

  it('writes a DELETE audit log and emits REPORT_DELETED', async () => {
    await mocks.service.remove(REPORT_ID, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'rapports_projet' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.REPORT_DELETED,
      expect.objectContaining({ reportId: REPORT_ID }),
    );
  });
});
