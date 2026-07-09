import { FormatRapport, StatutRapport, TypeRapport } from '@prisma/client';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportResponseDto } from './dto/report-response.dto';

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';
const REPORT_ID = 'rpt-00001-000-0000-000000000000';

function buildResponse(): ReportResponseDto {
  return {
    id: REPORT_ID,
    projectId: PROJECT_ID,
    codeRapport: 'RPT-001',
    titre: 'Rapport mensuel',
    description: null,
    type: TypeRapport.MENSUEL,
    format: FormatRapport.PDF,
    statut: StatutRapport.GENERE,
    periode: 'Janvier 2026',
    dateGeneration: new Date('2026-01-31'),
    dateTelechargement: null,
    version: '1.0',
    auteur: 'Amadou Diallo',
    tailleKo: 3200,
    nbTelechargements: 0,
    commentaires: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date('2026-01-31T00:00:00Z'),
    updatedAt: new Date('2026-01-31T00:00:00Z'),
  };
}

function buildMocks() {
  const reportService = {
    findAll: jest.fn().mockResolvedValue({
      data: [buildResponse()],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    }),
    findOne: jest.fn().mockResolvedValue(buildResponse()),
    create: jest.fn().mockResolvedValue(buildResponse()),
    update: jest.fn().mockResolvedValue(buildResponse()),
    remove: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ReportService>;

  const controller = new ReportController(reportService);
  const user = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' } as unknown;
  const req = { ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' }, headers: {} } as unknown;

  return { controller, reportService, user, req };
}

describe('ReportController', () => {
  it('findAll() delegates to service', async () => {
    const { controller, reportService } = buildMocks();
    const result = await controller.findAll(new ReportQueryDto());
    expect(reportService.findAll).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
  });

  it('findOne() delegates to service', async () => {
    const { controller, reportService } = buildMocks();
    const result = await controller.findOne(REPORT_ID);
    expect(reportService.findOne).toHaveBeenCalledWith(REPORT_ID);
    expect(result.id).toBe(REPORT_ID);
  });

  it('create() delegates to service with actor context', async () => {
    const { controller, reportService, user, req } = buildMocks();
    const dto = Object.assign(new CreateReportDto(), {
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
    await controller.create(dto, user, req);
    expect(reportService.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('update() delegates to service with actor context', async () => {
    const { controller, reportService, user, req } = buildMocks();
    const dto = Object.assign(new UpdateReportDto(), { statut: StatutRapport.VALIDE });
    await controller.update(REPORT_ID, dto, user, req);
    expect(reportService.update).toHaveBeenCalledWith(
      REPORT_ID,
      dto,
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('remove() returns success message', async () => {
    const { controller, reportService, user, req } = buildMocks();
    const result = await controller.remove(REPORT_ID, user, req);
    expect(reportService.remove).toHaveBeenCalledWith(
      REPORT_ID,
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Rapport supprimé' });
  });
});
