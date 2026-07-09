import { IndicatorType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  LogframeIndicatorRepository,
  FindLogframeIndicatorsParams,
} from './logframe-indicator.repository';

interface PrismaMock {
  logframeIndicator: {
    findMany: jest.Mock;
    count: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
}

function buildPrismaMock(): PrismaMock {
  return {
    logframeIndicator: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('LogframeIndicatorRepository', () => {
  let repo: LogframeIndicatorRepository;
  let prisma: PrismaMock;

  const baseParams: FindLogframeIndicatorsParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new LogframeIndicatorRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns indicators + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'i1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ indicators: [{ id: 'i1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on code, libelle and unite', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'taux' });

      const args = prisma.logframeIndicator.findMany.mock.calls[0][0] as {
        where: { OR: unknown[] };
      };
      expect(args.where.OR).toEqual([
        { code: { contains: 'taux', mode: 'insensitive' } },
        { libelle: { contains: 'taux', mode: 'insensitive' } },
        { unite: { contains: 'taux', mode: 'insensitive' } },
      ]);
    });

    it('applies objectiveId, type and actif filters', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({
        ...baseParams,
        objectiveId: 'obj-1',
        type: IndicatorType.OUTCOME,
        actif: true,
      });

      const args = prisma.logframeIndicator.findMany.mock.calls[0][0] as {
        where: { objective_id: string; type: IndicatorType; actif: boolean };
      };
      expect(args.where.objective_id).toBe('obj-1');
      expect(args.where.type).toBe(IndicatorType.OUTCOME);
      expect(args.where.actif).toBe(true);
    });
  });

  describe('lookups', () => {
    it('findById queries by id via findFirst', async () => {
      prisma.logframeIndicator.findFirst.mockResolvedValue({ id: 'i1' });
      await repo.findById('i1');
      expect(prisma.logframeIndicator.findFirst).toHaveBeenCalledWith({ where: { id: 'i1' } });
    });

    it('findByObjective queries by objective_id via findMany', async () => {
      prisma.logframeIndicator.findMany.mockResolvedValue([]);
      await repo.findByObjective('obj-1');
      expect(prisma.logframeIndicator.findMany).toHaveBeenCalledWith({
        where: { objective_id: 'obj-1' },
      });
    });
  });

  describe('create()', () => {
    it('maps camelCase fields to Prisma snake_case columns and defaults nullables', async () => {
      prisma.logframeIndicator.create.mockResolvedValue({ id: 'i1' });

      await repo.create({
        objectiveId: 'obj-1',
        code: 'IND-1',
        libelle: 'Taux de couverture',
        type: IndicatorType.OUTPUT,
        valeurCible: 90,
        createdBy: 'admin-1',
      });

      expect(prisma.logframeIndicator.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          objective_id: 'obj-1',
          code: 'IND-1',
          libelle: 'Taux de couverture',
          type: IndicatorType.OUTPUT,
          valeur_cible: 90,
          valeur_baseline: null,
          created_by: 'admin-1',
        }),
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields (valeur_actuelle, actif, updated_by)', async () => {
      prisma.logframeIndicator.update.mockResolvedValue({ id: 'i1' });

      await repo.update('i1', { valeurActuelle: 62.3, actif: false, updatedBy: 'a' });

      expect(prisma.logframeIndicator.update).toHaveBeenCalledWith({
        where: { id: 'i1' },
        data: expect.objectContaining({
          valeur_actuelle: 62.3,
          actif: false,
          updated_by: 'a',
        }),
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.logframeIndicator.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.logframeIndicator.delete.mockResolvedValue({ id: 'i1' });
      await repo.softDelete('i1');
      expect(prisma.logframeIndicator.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
    });
  });
});
