import { AuditAction, Prisma, PtbaActivite, PtbaStatut } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { WbsService } from '@/wbs/wbs.service';
import { LogframeIndicatorService } from '@/logframe-indicators/logframe-indicator.service';
import { LogframeObjectiveService } from '@/logframe-objectives/logframe-objective.service';
import { PtbaRepository } from './ptba.repository';
import { PtbaService } from './ptba.service';
import { PtbaQueryDto } from './dto/ptba-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PROJ_ID = 'proj-001';

function buildActivite(overrides: Partial<PtbaActivite> = {}): PtbaActivite {
  return {
    id: 'ptba-001',
    project_id: PROJ_ID,
    wbs_id: null,
    logframe_ref_id: null,
    code: 'ACT-2026-01',
    libelle: 'Formation des agents',
    description: null,
    statut: PtbaStatut.NON_DEMARRE,
    annee: 2026,
    trimestre: 1,
    date_debut_prevue: null,
    date_fin_prevue: null,
    date_debut_reelle: null,
    date_fin_reelle: null,
    montant_prevu: null,
    montant_realise: null,
    taux_realisation: null,
    responsable_id: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const ptbaRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<PtbaRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJ_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const wbsService = {
    findOne: jest.fn().mockResolvedValue({ id: 'wbs-1', projectId: PROJ_ID }),
  } as unknown as jest.Mocked<WbsService>;

  const logframeIndicatorService = {
    findOne: jest.fn().mockResolvedValue({ id: 'ind-1', objectiveId: 'obj-1' }),
  } as unknown as jest.Mocked<LogframeIndicatorService>;

  const logframeObjectiveService = {
    findOne: jest.fn().mockResolvedValue({ id: 'obj-1', projectId: PROJ_ID }),
  } as unknown as jest.Mocked<LogframeObjectiveService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new PtbaService(
    ptbaRepository,
    projectService,
    wbsService,
    logframeIndicatorService,
    logframeObjectiveService,
    auditService,
    eventEmitter,
  );

  return {
    service,
    ptbaRepository,
    projectService,
    wbsService,
    logframeIndicatorService,
    logframeObjectiveService,
    auditService,
    eventEmitter,
  };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('PtbaService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ptbaRepository.findManyPaginated.mockResolvedValue({
      activites: [buildActivite()],
      total: 1,
    });
  });

  it('returns a paginated result of PtbaResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new PtbaQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].projectId).toBe(PROJ_ID);
  });

  it('maps Decimal amounts to numbers in the response', async () => {
    mocks.ptbaRepository.findManyPaginated.mockResolvedValue({
      activites: [
        buildActivite({
          montant_prevu: 5000 as unknown as Prisma.Decimal,
          taux_realisation: 64 as unknown as Prisma.Decimal,
        }),
      ],
      total: 1,
    });

    const result = await mocks.service.findAll(new PtbaQueryDto());
    expect(result.data[0].montantPrevu).toBe(5000);
    expect(result.data[0].tauxRealisation).toBe(64);
  });

  it('forwards projectId, statut, annee, trimestre and wbsId filters', async () => {
    const query = Object.assign(new PtbaQueryDto(), {
      projectId: PROJ_ID,
      statut: PtbaStatut.EN_COURS,
      annee: 2026,
      trimestre: 2,
      wbsId: 'wbs-1',
    });
    await mocks.service.findAll(query);

    expect(mocks.ptbaRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJ_ID,
        statut: PtbaStatut.EN_COURS,
        annee: 2026,
        trimestre: 2,
        wbsId: 'wbs-1',
      }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new PtbaQueryDto(), {
      sortBy: 'project_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.ptbaRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field (annee)', async () => {
    const query = Object.assign(new PtbaQueryDto(), { sortBy: 'annee', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.ptbaRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { annee: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('PtbaService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a PtbaResponseDto for an existing activite', async () => {
    mocks.ptbaRepository.findById.mockResolvedValue(buildActivite());

    const result = await mocks.service.findOne('ptba-001');

    expect(result.id).toBe('ptba-001');
    expect(result.code).toBe('ACT-2026-01');
  });

  it('throws PTBA_ACTIVITE_NOT_FOUND when the activite does not exist', async () => {
    mocks.ptbaRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.PTBA_ACTIVITE_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('PtbaService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = {
    projectId: PROJ_ID,
    code: 'ACT-1',
    libelle: 'Formation',
    annee: 2026,
    trimestre: 1,
  };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ptbaRepository.create.mockResolvedValue(buildActivite());
  });

  it('verifies the project and creates with default statut NON_DEMARRE', async () => {
    await mocks.service.create(dto);

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJ_ID);
    expect(mocks.ptbaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ statut: PtbaStatut.NON_DEMARRE }),
    );
  });

  it('propagates PROJECT_NOT_FOUND (404) when the project does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_NOT_FOUND,
    });
    expect(mocks.ptbaRepository.create).not.toHaveBeenCalled();
  });

  it('propagates WBS_NODE_NOT_FOUND (404) when the wbs node does not exist', async () => {
    mocks.wbsService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.WBS_NODE_NOT_FOUND, 'Nœud WBS introuvable'),
    );

    await expect(mocks.service.create({ ...dto, wbsId: 'ghost' })).rejects.toMatchObject({
      errorCode: ErrorCode.WBS_NODE_NOT_FOUND,
    });
    expect(mocks.ptbaRepository.create).not.toHaveBeenCalled();
  });

  it('throws PTBA_INVALID_LINK (409) when the wbs belongs to another project', async () => {
    mocks.wbsService.findOne.mockResolvedValue({ id: 'wbs-1', projectId: 'other' } as never);

    await expect(mocks.service.create({ ...dto, wbsId: 'wbs-1' })).rejects.toMatchObject({
      errorCode: ErrorCode.PTBA_INVALID_LINK,
    });
    expect(mocks.ptbaRepository.create).not.toHaveBeenCalled();
  });

  it('propagates LOGFRAME_INDICATOR_NOT_FOUND (404) when the indicator does not exist', async () => {
    mocks.logframeIndicatorService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.LOGFRAME_INDICATOR_NOT_FOUND, 'Indicateur introuvable'),
    );

    await expect(
      mocks.service.create({ ...dto, logframeIndicatorId: 'ghost' }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.LOGFRAME_INDICATOR_NOT_FOUND });
    expect(mocks.ptbaRepository.create).not.toHaveBeenCalled();
  });

  it("throws PTBA_INVALID_LINK (409) when the indicator's objective belongs to another project", async () => {
    mocks.logframeObjectiveService.findOne.mockResolvedValue({
      id: 'obj-1',
      projectId: 'other',
    } as never);

    await expect(
      mocks.service.create({ ...dto, logframeIndicatorId: 'ind-1' }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PTBA_INVALID_LINK });
    expect(mocks.ptbaRepository.create).not.toHaveBeenCalled();
  });

  it('translates a Prisma P2002 into a CONFLICT', async () => {
    mocks.ptbaRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });

  it('writes a CREATE audit log and emits PTBA_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'ptba_activites',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.PTBA_CREATED,
      expect.objectContaining({ ptbaId: 'ptba-001', projectId: PROJ_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('PtbaService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ptbaRepository.findById.mockResolvedValue(buildActivite());
    mocks.ptbaRepository.update.mockResolvedValue(buildActivite({ statut: PtbaStatut.EN_COURS }));
  });

  it('throws PTBA_ACTIVITE_NOT_FOUND when the activite does not exist', async () => {
    mocks.ptbaRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.service.update('missing', { statut: PtbaStatut.EN_COURS }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('validates a re-linked wbs against the activite project (409 if cross-project)', async () => {
    mocks.wbsService.findOne.mockResolvedValue({ id: 'wbs-9', projectId: 'other' } as never);

    await expect(mocks.service.update('ptba-001', { wbsId: 'wbs-9' })).rejects.toMatchObject({
      errorCode: ErrorCode.PTBA_INVALID_LINK,
    });
    expect(mocks.ptbaRepository.update).not.toHaveBeenCalled();
  });

  it('writes an UPDATE audit log with avant/apres and emits PTBA_UPDATED', async () => {
    await mocks.service.update('ptba-001', { statut: PtbaStatut.EN_COURS }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'ptba_activites',
        enregistrementId: 'ptba-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.PTBA_UPDATED, {
      ptbaId: 'ptba-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('PtbaService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.ptbaRepository.findById.mockResolvedValue(buildActivite());
  });

  it('throws PTBA_ACTIVITE_NOT_FOUND when the activite does not exist', async () => {
    mocks.ptbaRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.ptbaRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('ptba-001');

    expect(mocks.ptbaRepository.softDelete).toHaveBeenCalledWith('ptba-001');
  });

  it('writes a DELETE audit log and emits PTBA_DELETED', async () => {
    await mocks.service.remove('ptba-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'ptba_activites' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.PTBA_DELETED, {
      ptbaId: 'ptba-001',
    });
  });
});
