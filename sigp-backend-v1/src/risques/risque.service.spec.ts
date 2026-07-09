import { AuditAction, RiskImpact, RiskProbability, RiskStatus, Risque } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectService } from '@/projects/project.service';
import { RisqueRepository } from './risque.repository';
import { RisqueService } from './risque.service';
import { RisqueQueryDto } from './dto/risque-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';
const RISQUE_ID = 'risk-0001-0000-0000-000000000000';

function buildRisque(overrides: Partial<Risque> = {}): Risque {
  return {
    id: RISQUE_ID,
    project_id: PROJECT_ID,
    wbs_id: null,
    code: 'RSK-001',
    description: 'Retard dans la livraison du matériel',
    categorie: 'Logistique',
    probabilite: RiskProbability.POSSIBLE,
    impact: RiskImpact.IMPORTANT,
    niveau_criticite: 'ELEVE',
    statut: RiskStatus.OUVERT,
    strategie: null,
    plan_action: null,
    responsable_id: null,
    date_detection: null,
    date_echeance: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildMocks() {
  const risqueRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByProject: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<RisqueRepository>;

  const projectService = {
    findOne: jest.fn().mockResolvedValue({ id: PROJECT_ID }),
  } as unknown as jest.Mocked<ProjectService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new RisqueService(risqueRepository, projectService, auditService, eventEmitter);

  return { service, risqueRepository, projectService, auditService, eventEmitter };
}

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('RisqueService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.risqueRepository.findManyPaginated.mockResolvedValue({
      risques: [buildRisque()],
      total: 1,
    });
  });

  it('returns a paginated result with mapped fields', async () => {
    const result = await mocks.service.findAll(new RisqueQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0].projectId).toBe(PROJECT_ID);
    expect(result.data[0].niveauCriticite).toBe('ELEVE');
  });

  it('forwards all query filters to the repository', async () => {
    const query = Object.assign(new RisqueQueryDto(), {
      projectId: PROJECT_ID,
      statut: RiskStatus.OUVERT,
      probabilite: RiskProbability.POSSIBLE,
      impact: RiskImpact.IMPORTANT,
    });
    await mocks.service.findAll(query);

    expect(mocks.risqueRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        statut: RiskStatus.OUVERT,
        probabilite: RiskProbability.POSSIBLE,
        impact: RiskImpact.IMPORTANT,
      }),
    );
  });

  it('falls back to created_at when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new RisqueQueryDto(), {
      sortBy: 'project_id; DROP',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.risqueRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (statut)', async () => {
    const query = Object.assign(new RisqueQueryDto(), { sortBy: 'statut', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.risqueRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { statut: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (niveau_criticite)', async () => {
    const query = Object.assign(new RisqueQueryDto(), {
      sortBy: 'niveau_criticite',
      sortOrder: 'desc',
    });
    await mocks.service.findAll(query);

    expect(mocks.risqueRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { niveau_criticite: 'desc' } }),
    );
  });

  it('honours whitelisted sort field (date_echeance)', async () => {
    const query = Object.assign(new RisqueQueryDto(), {
      sortBy: 'date_echeance',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.risqueRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { date_echeance: 'asc' } }),
    );
  });
});

// ─── findOne ─────────────────────────────────────────────────────────────────

describe('RisqueService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a RisqueResponseDto for an existing risque', async () => {
    mocks.risqueRepository.findById.mockResolvedValue(buildRisque());

    const result = await mocks.service.findOne(RISQUE_ID);

    expect(result.id).toBe(RISQUE_ID);
    expect(result.projectId).toBe(PROJECT_ID);
    expect(result.probabilite).toBe(RiskProbability.POSSIBLE);
  });

  it('throws RISK_NOT_FOUND when it does not exist', async () => {
    mocks.risqueRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.RISK_NOT_FOUND,
    });
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('RisqueService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.risqueRepository.create.mockResolvedValue(buildRisque());
  });

  it('creates a risque after validating the project', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      description: 'Risque test',
      probabilite: RiskProbability.POSSIBLE,
      impact: RiskImpact.IMPORTANT,
    });

    expect(mocks.projectService.findOne).toHaveBeenCalledWith(PROJECT_ID);
    expect(mocks.risqueRepository.create).toHaveBeenCalled();
  });

  it('throws 404 when projectId does not exist', async () => {
    mocks.projectService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.PROJECT_NOT_FOUND, 'Projet introuvable'),
    );

    await expect(
      mocks.service.create({
        projectId: PROJECT_ID,
        description: 'Risque test',
        probabilite: RiskProbability.POSSIBLE,
        impact: RiskImpact.IMPORTANT,
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PROJECT_NOT_FOUND });
    expect(mocks.risqueRepository.create).not.toHaveBeenCalled();
  });

  it('auto-computes niveauCriticite FAIBLE for FAIBLE×FAIBLE', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      description: 'Risque faible',
      probabilite: RiskProbability.FAIBLE,
      impact: RiskImpact.FAIBLE,
    });

    expect(mocks.risqueRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ niveauCriticite: 'FAIBLE' }),
    );
  });

  it('auto-computes niveauCriticite MODERE for FAIBLE×IMPORTANT', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      description: 'Risque modéré',
      probabilite: RiskProbability.FAIBLE,
      impact: RiskImpact.IMPORTANT,
    });

    expect(mocks.risqueRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ niveauCriticite: 'MODERE' }),
    );
  });

  it('auto-computes niveauCriticite ELEVE for POSSIBLE×IMPORTANT', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      description: 'Risque élevé',
      probabilite: RiskProbability.POSSIBLE,
      impact: RiskImpact.IMPORTANT,
    });

    expect(mocks.risqueRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ niveauCriticite: 'ELEVE' }),
    );
  });

  it('auto-computes niveauCriticite CRITIQUE for PROBABLE×IMPORTANT', async () => {
    mocks.risqueRepository.create.mockResolvedValue(
      buildRisque({
        probabilite: RiskProbability.PROBABLE,
        impact: RiskImpact.IMPORTANT,
        niveau_criticite: 'CRITIQUE',
      }),
    );

    await mocks.service.create({
      projectId: PROJECT_ID,
      description: 'Risque critique',
      probabilite: RiskProbability.PROBABLE,
      impact: RiskImpact.IMPORTANT,
    });

    expect(mocks.risqueRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ niveauCriticite: 'CRITIQUE' }),
    );
  });

  it('converts date strings to Date objects', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      description: 'Risque test',
      probabilite: RiskProbability.POSSIBLE,
      impact: RiskImpact.IMPORTANT,
      dateDetection: '2026-03-01',
      dateEcheance: '2026-06-01',
    });

    expect(mocks.risqueRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dateDetection: new Date('2026-03-01'),
        dateEcheance: new Date('2026-06-01'),
      }),
    );
  });

  it('writes a CREATE audit log and emits RISQUE_CREATED', async () => {
    await mocks.service.create(
      {
        projectId: PROJECT_ID,
        description: 'Risque test',
        probabilite: RiskProbability.POSSIBLE,
        impact: RiskImpact.IMPORTANT,
      },
      { userId: 'admin-1', ip: '127.0.0.1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'risques',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.RISQUE_CREATED,
      expect.objectContaining({ risqueId: RISQUE_ID }),
    );
  });

  it('emits RISK_CRITICAL_DETECTED when niveauCriticite is CRITIQUE', async () => {
    mocks.risqueRepository.create.mockResolvedValue(
      buildRisque({
        probabilite: RiskProbability.QUASI_CERTAIN,
        impact: RiskImpact.CRITIQUE,
        niveau_criticite: 'CRITIQUE',
      }),
    );

    await mocks.service.create({
      projectId: PROJECT_ID,
      description: 'Risque critique',
      probabilite: RiskProbability.QUASI_CERTAIN,
      impact: RiskImpact.CRITIQUE,
    });

    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.RISK_CRITICAL_DETECTED,
      expect.objectContaining({ risqueId: RISQUE_ID }),
    );
  });

  it('does NOT emit RISK_CRITICAL_DETECTED for non-critique levels', async () => {
    await mocks.service.create({
      projectId: PROJECT_ID,
      description: 'Risque modéré',
      probabilite: RiskProbability.FAIBLE,
      impact: RiskImpact.MODERE,
    });

    const criticalEmits = (mocks.eventEmitter.emit as jest.Mock).mock.calls.filter(
      ([event]) => event === AppEvent.RISK_CRITICAL_DETECTED,
    );
    expect(criticalEmits).toHaveLength(0);
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('RisqueService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.risqueRepository.findById.mockResolvedValue(buildRisque());
    mocks.risqueRepository.update.mockResolvedValue(buildRisque({ statut: RiskStatus.EN_COURS }));
  });

  it('throws RISK_NOT_FOUND when it does not exist', async () => {
    mocks.risqueRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('recomputes niveauCriticite when probabilite changes', async () => {
    mocks.risqueRepository.update.mockResolvedValue(
      buildRisque({ probabilite: RiskProbability.PROBABLE, niveau_criticite: 'CRITIQUE' }),
    );

    await mocks.service.update(RISQUE_ID, { probabilite: RiskProbability.PROBABLE });

    expect(mocks.risqueRepository.update).toHaveBeenCalledWith(
      RISQUE_ID,
      expect.objectContaining({ niveauCriticite: 'CRITIQUE' }),
    );
  });

  it('preserves niveauCriticite when probabilite and impact are unchanged', async () => {
    mocks.risqueRepository.update.mockResolvedValue(buildRisque());

    await mocks.service.update(RISQUE_ID, { description: 'Updated description' });

    expect(mocks.risqueRepository.update).toHaveBeenCalledWith(
      RISQUE_ID,
      expect.objectContaining({ niveauCriticite: 'ELEVE' }),
    );
  });

  it('converts date strings to Date objects on update', async () => {
    await mocks.service.update(RISQUE_ID, { dateDetection: '2026-03-20' });

    expect(mocks.risqueRepository.update).toHaveBeenCalledWith(
      RISQUE_ID,
      expect.objectContaining({ dateDetection: new Date('2026-03-20') }),
    );
  });

  it('writes an UPDATE audit log with avant/apres and emits RISQUE_UPDATED', async () => {
    await mocks.service.update(RISQUE_ID, { statut: RiskStatus.EN_COURS }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'risques',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.RISQUE_UPDATED, {
      risqueId: RISQUE_ID,
    });
  });

  it('emits RISK_STATUS_CHANGED when statut changes', async () => {
    await mocks.service.update(RISQUE_ID, { statut: RiskStatus.EN_COURS });

    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.RISK_STATUS_CHANGED,
      expect.objectContaining({
        risqueId: RISQUE_ID,
        oldStatut: RiskStatus.OUVERT,
        newStatut: RiskStatus.EN_COURS,
      }),
    );
  });

  it('does NOT emit RISK_STATUS_CHANGED when statut is unchanged', async () => {
    await mocks.service.update(RISQUE_ID, { statut: RiskStatus.OUVERT });

    const statusEmits = (mocks.eventEmitter.emit as jest.Mock).mock.calls.filter(
      ([event]) => event === AppEvent.RISK_STATUS_CHANGED,
    );
    expect(statusEmits).toHaveLength(0);
  });

  it('emits RISK_CRITICAL_DETECTED when niveauCriticite transitions to CRITIQUE', async () => {
    mocks.risqueRepository.update.mockResolvedValue(
      buildRisque({ probabilite: RiskProbability.QUASI_CERTAIN, niveau_criticite: 'CRITIQUE' }),
    );

    await mocks.service.update(RISQUE_ID, { probabilite: RiskProbability.QUASI_CERTAIN });

    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.RISK_CRITICAL_DETECTED,
      expect.objectContaining({ risqueId: RISQUE_ID }),
    );
  });
});

// ─── remove ──────────────────────────────────────────────────────────────────

describe('RisqueService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.risqueRepository.findById.mockResolvedValue(buildRisque());
  });

  it('throws RISK_NOT_FOUND when it does not exist', async () => {
    mocks.risqueRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.risqueRepository.softDelete).not.toHaveBeenCalled();
  });

  it('soft-deletes the risque via the repository', async () => {
    await mocks.service.remove(RISQUE_ID);

    expect(mocks.risqueRepository.softDelete).toHaveBeenCalledWith(RISQUE_ID);
  });

  it('writes a DELETE audit log and emits RISQUE_DELETED', async () => {
    await mocks.service.remove(RISQUE_ID, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'risques' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.RISQUE_DELETED,
      expect.objectContaining({ risqueId: RISQUE_ID }),
    );
  });
});
