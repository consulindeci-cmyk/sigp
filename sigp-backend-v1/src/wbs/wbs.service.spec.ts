import { AuditAction, Prisma, WbsNode, WbsNodeType } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { LogframeObjectiveService } from '@/logframe-objectives/logframe-objective.service';
import { WbsRepository } from './wbs.repository';
import { WbsService } from './wbs.service';
import { WbsQueryDto } from './dto/wbs-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PROJ_ID = 'proj-001';

function buildNode(overrides: Partial<WbsNode> = {}): WbsNode {
  return {
    id: 'wbs-001',
    project_id: PROJ_ID,
    parent_id: null,
    objective_id: null,
    code: 'WBS-1',
    libelle: 'Phase de préparation',
    type: WbsNodeType.PHASE,
    ordre: 0,
    niveau: 1,
    responsable_id: null,
    actif: true,
    date_debut: null,
    date_fin: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const wbsRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    findChildren: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<WbsRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJ_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const logframeObjectiveService = {
    findOne: jest.fn().mockResolvedValue({ id: 'obj-1' }),
  } as unknown as jest.Mocked<LogframeObjectiveService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new WbsService(
    wbsRepository,
    projectService,
    logframeObjectiveService,
    auditService,
    eventEmitter,
  );

  return {
    service,
    wbsRepository,
    projectService,
    logframeObjectiveService,
    auditService,
    eventEmitter,
  };
}

// ─── findAll ────────────────────────────────────────────────────────────────

describe('WbsService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.wbsRepository.findManyPaginated.mockResolvedValue({ nodes: [buildNode()], total: 1 });
  });

  it('returns a paginated result of WbsResponseDto without internal fields', async () => {
    const result = await mocks.service.findAll(new WbsQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).not.toHaveProperty('deleted_at');
    expect(result.data[0]).not.toHaveProperty('created_by');
    expect(result.data[0].projectId).toBe(PROJ_ID);
  });

  it('forwards projectId, parentId, objectiveId, type and actif filters', async () => {
    const query = Object.assign(new WbsQueryDto(), {
      projectId: PROJ_ID,
      parentId: 'par-1',
      objectiveId: 'obj-1',
      type: WbsNodeType.LOT,
      actif: false,
    });
    await mocks.service.findAll(query);

    expect(mocks.wbsRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJ_ID,
        parentId: 'par-1',
        objectiveId: 'obj-1',
        type: WbsNodeType.LOT,
        actif: false,
      }),
    );
  });

  it('falls back to created_at ordering when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new WbsQueryDto(), {
      sortBy: 'project_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.wbsRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours a whitelisted sort field (niveau)', async () => {
    const query = Object.assign(new WbsQueryDto(), { sortBy: 'niveau', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.wbsRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { niveau: 'asc' } }),
    );
  });
});

// ─── findOne ────────────────────────────────────────────────────────────────

describe('WbsService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a WbsResponseDto for an existing node', async () => {
    mocks.wbsRepository.findById.mockResolvedValue(buildNode());

    const result = await mocks.service.findOne('wbs-001');

    expect(result.id).toBe('wbs-001');
    expect(result.code).toBe('WBS-1');
  });

  it('throws WBS_NODE_NOT_FOUND when the node does not exist', async () => {
    mocks.wbsRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.WBS_NODE_NOT_FOUND,
    });
  });
});

// ─── create ─────────────────────────────────────────────────────────────────

describe('WbsService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;
  const dto = { projectId: PROJ_ID, code: 'WBS-1', libelle: 'Phase', type: WbsNodeType.PHASE };

  beforeEach(() => {
    mocks = buildMocks();
    mocks.wbsRepository.create.mockResolvedValue(buildNode());
  });

  it('verifies the project exists and creates a root node with niveau 1', async () => {
    await mocks.service.create(dto);

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJ_ID);
    expect(mocks.wbsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ niveau: 1 }));
  });

  it('propagates PROJECT_NOT_FOUND (404) when the project does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.PROJECT_NOT_FOUND,
    });
    expect(mocks.wbsRepository.create).not.toHaveBeenCalled();
  });

  it('verifies the objective when objectiveId is provided (404 if missing)', async () => {
    mocks.logframeObjectiveService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.LOGFRAME_OBJECTIVE_NOT_FOUND, 'Objectif introuvable'),
    );

    await expect(mocks.service.create({ ...dto, objectiveId: 'ghost' })).rejects.toMatchObject({
      errorCode: ErrorCode.LOGFRAME_OBJECTIVE_NOT_FOUND,
    });
    expect(mocks.wbsRepository.create).not.toHaveBeenCalled();
  });

  it('derives niveau = parent.niveau + 1 when a valid parent is provided', async () => {
    mocks.wbsRepository.findById.mockResolvedValue(buildNode({ id: 'par-1', niveau: 2 }));

    await mocks.service.create({ ...dto, parentId: 'par-1' });

    expect(mocks.wbsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ niveau: 3 }));
  });

  it('throws WBS_NODE_NOT_FOUND (404) when the parent does not exist', async () => {
    mocks.wbsRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.create({ ...dto, parentId: 'ghost' })).rejects.toMatchObject({
      errorCode: ErrorCode.WBS_NODE_NOT_FOUND,
    });
    expect(mocks.wbsRepository.create).not.toHaveBeenCalled();
  });

  it('throws WBS_INVALID_HIERARCHY (409) when the parent belongs to another project', async () => {
    mocks.wbsRepository.findById.mockResolvedValue(buildNode({ id: 'par-1', project_id: 'other' }));

    await expect(mocks.service.create({ ...dto, parentId: 'par-1' })).rejects.toMatchObject({
      errorCode: ErrorCode.WBS_INVALID_HIERARCHY,
    });
  });

  it('translates a Prisma P2002 into a CONFLICT', async () => {
    mocks.wbsRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: '6' }),
    );

    await expect(mocks.service.create(dto)).rejects.toMatchObject({
      errorCode: ErrorCode.CONFLICT,
    });
  });

  it('writes a CREATE audit log and emits WBS_NODE_CREATED', async () => {
    await mocks.service.create(dto, { userId: 'admin-1', ip: '127.0.0.1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'wbs_nodes',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.WBS_NODE_CREATED,
      expect.objectContaining({ wbsNodeId: 'wbs-001', projectId: PROJ_ID }),
    );
  });
});

// ─── update ─────────────────────────────────────────────────────────────────

describe('WbsService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.wbsRepository.findById.mockImplementation((idArg: string) => {
      if (idArg === 'wbs-001') return Promise.resolve(buildNode());
      return Promise.resolve(null);
    });
    mocks.wbsRepository.update.mockResolvedValue(buildNode({ libelle: 'Nouveau' }));
  });

  it('throws WBS_NODE_NOT_FOUND when the node does not exist', async () => {
    mocks.wbsRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', { libelle: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects self-parenting with WBS_INVALID_HIERARCHY (409)', async () => {
    await expect(mocks.service.update('wbs-001', { parentId: 'wbs-001' })).rejects.toMatchObject({
      errorCode: ErrorCode.WBS_INVALID_HIERARCHY,
    });
    expect(mocks.wbsRepository.update).not.toHaveBeenCalled();
  });

  it('rejects a direct cycle (parent whose parent is the node itself)', async () => {
    mocks.wbsRepository.findById.mockImplementation((idArg: string) => {
      if (idArg === 'wbs-001') return Promise.resolve(buildNode());
      if (idArg === 'par-1')
        return Promise.resolve(buildNode({ id: 'par-1', parent_id: 'wbs-001' }));
      return Promise.resolve(null);
    });

    await expect(mocks.service.update('wbs-001', { parentId: 'par-1' })).rejects.toMatchObject({
      errorCode: ErrorCode.WBS_INVALID_HIERARCHY,
    });
    expect(mocks.wbsRepository.update).not.toHaveBeenCalled();
  });

  it('recomputes niveau = parent.niveau + 1 on valid re-parenting', async () => {
    mocks.wbsRepository.findById.mockImplementation((idArg: string) => {
      if (idArg === 'wbs-001') return Promise.resolve(buildNode());
      if (idArg === 'par-1') return Promise.resolve(buildNode({ id: 'par-1', niveau: 2 }));
      return Promise.resolve(null);
    });

    await mocks.service.update('wbs-001', { parentId: 'par-1' });

    expect(mocks.wbsRepository.update).toHaveBeenCalledWith(
      'wbs-001',
      expect.objectContaining({ parentId: 'par-1', niveau: 3 }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits WBS_NODE_UPDATED', async () => {
    await mocks.service.update('wbs-001', { libelle: 'Nouveau' }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'wbs_nodes',
        enregistrementId: 'wbs-001',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.WBS_NODE_UPDATED, {
      wbsNodeId: 'wbs-001',
    });
  });
});

// ─── remove (soft delete) ─────────────────────────────────────────────────────

describe('WbsService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.wbsRepository.findById.mockResolvedValue(buildNode());
  });

  it('throws WBS_NODE_NOT_FOUND when the node does not exist', async () => {
    mocks.wbsRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.wbsRepository.softDelete).not.toHaveBeenCalled();
  });

  it('performs a soft delete via the repository', async () => {
    await mocks.service.remove('wbs-001');

    expect(mocks.wbsRepository.softDelete).toHaveBeenCalledWith('wbs-001');
  });

  it('writes a DELETE audit log and emits WBS_NODE_DELETED', async () => {
    await mocks.service.remove('wbs-001', { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'wbs_nodes' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.WBS_NODE_DELETED, {
      wbsNodeId: 'wbs-001',
    });
  });
});
