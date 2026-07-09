import { Contract, ContractStatus, ContractType, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ContractRepository } from './contract.repository';

const PROJECT_ID = 'proj-0001-0000-0000-000000000000';

function buildContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'ctr-0001-0000-0000-000000000000',
    project_id: PROJECT_ID,
    marche_id: null,
    numero: 'CTR-2026-001',
    intitule: 'Contrat de fourniture de matériel',
    type: ContractType.MARCHE,
    statut: ContractStatus.ACTIF,
    titulaire: 'Entreprise Alpha',
    montant: 10000000 as unknown as Prisma.Decimal,
    devise: 'XOF',
    date_signature: new Date('2026-01-15'),
    date_debut: new Date('2026-02-01'),
    date_fin: new Date('2026-12-31'),
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildPrisma() {
  const contract = {
    findMany: jest.fn().mockResolvedValue([buildContract()]),
    findFirst: jest.fn().mockResolvedValue(buildContract()),
    create: jest.fn().mockResolvedValue(buildContract()),
    update: jest.fn().mockResolvedValue(buildContract()),
    delete: jest.fn().mockResolvedValue(buildContract()),
    count: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    contract,
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  return { prisma, contract };
}

describe('ContractRepository', () => {
  let repo: ContractRepository;
  let contract: ReturnType<typeof buildPrisma>['contract'];

  beforeEach(() => {
    const mocks = buildPrisma();
    repo = new ContractRepository(mocks.prisma);
    contract = mocks.contract;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findManyPaginated ───────────────────────────────────────────────────────

  describe('findManyPaginated()', () => {
    it('returns contracts and total via $transaction', async () => {
      const result = await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      expect(result.contracts).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies projectId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        projectId: PROJECT_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ project_id: PROJECT_ID }),
        }),
      );
    });

    it('applies type filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        type: ContractType.CONVENTION,
        orderBy: { created_at: 'desc' },
      });

      expect(contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: ContractType.CONVENTION }),
        }),
      );
    });

    it('applies statut filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        statut: ContractStatus.CLOTURE,
        orderBy: { created_at: 'desc' },
      });

      expect(contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statut: ContractStatus.CLOTURE }),
        }),
      );
    });

    it('builds OR search on numero, intitule, titulaire, notes', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        search: 'Alpha',
        orderBy: { created_at: 'desc' },
      });

      expect(contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ numero: expect.objectContaining({ contains: 'Alpha' }) }),
              expect.objectContaining({ intitule: expect.objectContaining({ contains: 'Alpha' }) }),
              expect.objectContaining({
                titulaire: expect.objectContaining({ contains: 'Alpha' }),
              }),
              expect.objectContaining({ notes: expect.objectContaining({ contains: 'Alpha' }) }),
            ]),
          }),
        }),
      );
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls findFirst with the given id', async () => {
      await repo.findById('ctr-0001-0000-0000-000000000000');

      expect(contract.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'ctr-0001-0000-0000-000000000000' }),
        }),
      );
    });

    it('returns null when not found', async () => {
      contract.findFirst.mockResolvedValueOnce(null);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  // ─── findByProject ────────────────────────────────────────────────────────────

  describe('findByProject()', () => {
    it('filters by project_id', async () => {
      await repo.findByProject(PROJECT_ID);

      expect(contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { project_id: PROJECT_ID } }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('maps camelCase to snake_case and applies MARCHE/ACTIF/XOF defaults', async () => {
      await repo.create({
        projectId: PROJECT_ID,
        numero: 'CTR-2026-001',
        intitule: 'Contrat test',
        titulaire: 'Entreprise Alpha',
        montant: 10000000,
      });

      expect(contract.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            project_id: PROJECT_ID,
            type: ContractType.MARCHE,
            statut: ContractStatus.ACTIF,
            devise: 'XOF',
          }),
        }),
      );
    });

    it('maps date fields to snake_case', async () => {
      const dateSignature = new Date('2026-01-15');
      await repo.create({
        projectId: PROJECT_ID,
        numero: 'CTR-2026-001',
        intitule: 'Contrat test',
        titulaire: 'Entreprise Alpha',
        montant: 10000000,
        dateSignature,
      });

      expect(contract.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date_signature: dateSignature }),
        }),
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('calls prisma.update with the given id', async () => {
      await repo.update('ctr-0001-0000-0000-000000000000', { statut: ContractStatus.CLOTURE });

      expect(contract.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'ctr-0001-0000-0000-000000000000' } }),
      );
    });
  });

  // ─── softDelete ──────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('calls prisma.delete (intercepted by middleware)', async () => {
      await repo.softDelete('ctr-0001-0000-0000-000000000000');

      expect(contract.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'ctr-0001-0000-0000-000000000000' } }),
      );
    });
  });
});
