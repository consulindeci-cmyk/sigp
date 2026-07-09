import { RiskImpact, RiskProbability, RiskStatus, Risque } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { RisqueRepository } from './risque.repository';

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

function buildPrisma() {
  const risque = {
    findMany: jest.fn().mockResolvedValue([buildRisque()]),
    findFirst: jest.fn().mockResolvedValue(buildRisque()),
    create: jest.fn().mockResolvedValue(buildRisque()),
    update: jest.fn().mockResolvedValue(buildRisque()),
    count: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    risque,
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  return { prisma, risque };
}

describe('RisqueRepository', () => {
  let repo: RisqueRepository;
  let risque: ReturnType<typeof buildPrisma>['risque'];

  beforeEach(() => {
    const mocks = buildPrisma();
    repo = new RisqueRepository(mocks.prisma);
    risque = mocks.risque;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findManyPaginated ───────────────────────────────────────────────────────

  describe('findManyPaginated()', () => {
    it('returns risques and total via $transaction', async () => {
      const result = await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      expect(result.risques).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies projectId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        projectId: PROJECT_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(risque.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ project_id: PROJECT_ID }),
        }),
      );
    });

    it('applies probabilite filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        probabilite: RiskProbability.POSSIBLE,
        orderBy: { created_at: 'desc' },
      });

      expect(risque.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ probabilite: RiskProbability.POSSIBLE }),
        }),
      );
    });

    it('applies impact filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        impact: RiskImpact.CRITIQUE,
        orderBy: { created_at: 'desc' },
      });

      expect(risque.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ impact: RiskImpact.CRITIQUE }),
        }),
      );
    });

    it('applies statut filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        statut: RiskStatus.OUVERT,
        orderBy: { created_at: 'desc' },
      });

      expect(risque.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statut: RiskStatus.OUVERT }),
        }),
      );
    });

    it('builds OR search on code, description, categorie, strategie', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        search: 'livraison',
        orderBy: { created_at: 'desc' },
      });

      expect(risque.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ code: expect.objectContaining({ contains: 'livraison' }) }),
              expect.objectContaining({
                description: expect.objectContaining({ contains: 'livraison' }),
              }),
              expect.objectContaining({
                categorie: expect.objectContaining({ contains: 'livraison' }),
              }),
              expect.objectContaining({
                strategie: expect.objectContaining({ contains: 'livraison' }),
              }),
            ]),
          }),
        }),
      );
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls findFirst with the given id', async () => {
      await repo.findById(RISQUE_ID);

      expect(risque.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: RISQUE_ID }) }),
      );
    });

    it('returns null when not found', async () => {
      risque.findFirst.mockResolvedValueOnce(null);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  // ─── findByProject ───────────────────────────────────────────────────────────

  describe('findByProject()', () => {
    it('filters by project_id', async () => {
      await repo.findByProject(PROJECT_ID);

      expect(risque.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { project_id: PROJECT_ID } }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('maps camelCase to snake_case fields', async () => {
      await repo.create({
        projectId: PROJECT_ID,
        description: 'Retard livraison',
        probabilite: RiskProbability.POSSIBLE,
        impact: RiskImpact.IMPORTANT,
        niveauCriticite: 'ELEVE',
      });

      expect(risque.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            project_id: PROJECT_ID,
            description: 'Retard livraison',
            probabilite: RiskProbability.POSSIBLE,
            impact: RiskImpact.IMPORTANT,
            niveau_criticite: 'ELEVE',
          }),
        }),
      );
    });

    it('stores optional date fields', async () => {
      const dateDetection = new Date('2026-03-01');
      await repo.create({
        projectId: PROJECT_ID,
        description: 'Risque test',
        probabilite: RiskProbability.FAIBLE,
        impact: RiskImpact.FAIBLE,
        niveauCriticite: 'FAIBLE',
        dateDetection,
      });

      expect(risque.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date_detection: dateDetection }),
        }),
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('calls prisma.update with the given id', async () => {
      await repo.update(RISQUE_ID, { statut: RiskStatus.EN_COURS });

      expect(risque.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: RISQUE_ID } }),
      );
    });

    it('passes niveau_criticite on update', async () => {
      await repo.update(RISQUE_ID, {
        probabilite: RiskProbability.PROBABLE,
        impact: RiskImpact.CRITIQUE,
        niveauCriticite: 'CRITIQUE',
      });

      expect(risque.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ niveau_criticite: 'CRITIQUE' }),
        }),
      );
    });
  });

  // ─── softDelete ──────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('sets deleted_at via prisma.update (soft delete)', async () => {
      await repo.softDelete(RISQUE_ID);

      expect(risque.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: RISQUE_ID },
          data: expect.objectContaining({ deleted_at: expect.any(Date) }),
        }),
      );
    });
  });
});
