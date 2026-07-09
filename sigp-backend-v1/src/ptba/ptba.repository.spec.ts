import { PtbaStatut } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PtbaRepository, FindPtbaActivitesParams } from './ptba.repository';

interface PrismaMock {
  ptbaActivite: {
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
    ptbaActivite: {
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

describe('PtbaRepository', () => {
  let repo: PtbaRepository;
  let prisma: PrismaMock;

  const baseParams: FindPtbaActivitesParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new PtbaRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns activites + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'a1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ activites: [{ id: 'a1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on code, libelle and description', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'formation' });

      const args = prisma.ptbaActivite.findMany.mock.calls[0][0] as { where: { OR: unknown[] } };
      expect(args.where.OR).toEqual([
        { code: { contains: 'formation', mode: 'insensitive' } },
        { libelle: { contains: 'formation', mode: 'insensitive' } },
        { description: { contains: 'formation', mode: 'insensitive' } },
      ]);
    });

    it('applies projectId, statut, annee, trimestre and wbsId filters', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({
        ...baseParams,
        projectId: 'proj-1',
        statut: PtbaStatut.EN_COURS,
        annee: 2026,
        trimestre: 2,
        wbsId: 'wbs-1',
      });

      const args = prisma.ptbaActivite.findMany.mock.calls[0][0] as {
        where: {
          project_id: string;
          statut: PtbaStatut;
          annee: number;
          trimestre: number;
          wbs_id: string;
        };
      };
      expect(args.where.project_id).toBe('proj-1');
      expect(args.where.statut).toBe(PtbaStatut.EN_COURS);
      expect(args.where.annee).toBe(2026);
      expect(args.where.trimestre).toBe(2);
      expect(args.where.wbs_id).toBe('wbs-1');
    });
  });

  describe('lookups', () => {
    it('findById queries by id via findFirst', async () => {
      prisma.ptbaActivite.findFirst.mockResolvedValue({ id: 'a1' });
      await repo.findById('a1');
      expect(prisma.ptbaActivite.findFirst).toHaveBeenCalledWith({ where: { id: 'a1' } });
    });

    it('findByProject queries by project_id via findMany', async () => {
      prisma.ptbaActivite.findMany.mockResolvedValue([]);
      await repo.findByProject('proj-1');
      expect(prisma.ptbaActivite.findMany).toHaveBeenCalledWith({
        where: { project_id: 'proj-1' },
      });
    });
  });

  describe('create()', () => {
    it('maps camelCase fields to Prisma snake_case columns (incl. logframe_ref_id) and defaults nullables', async () => {
      prisma.ptbaActivite.create.mockResolvedValue({ id: 'a1' });

      await repo.create({
        projectId: 'proj-1',
        wbsId: 'wbs-1',
        logframeRefId: 'ind-1',
        code: 'ACT-1',
        libelle: 'Formation',
        statut: PtbaStatut.NON_DEMARRE,
        annee: 2026,
        trimestre: 1,
        montantPrevu: 5000,
        createdBy: 'admin-1',
      });

      expect(prisma.ptbaActivite.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          project_id: 'proj-1',
          wbs_id: 'wbs-1',
          logframe_ref_id: 'ind-1',
          code: 'ACT-1',
          statut: PtbaStatut.NON_DEMARRE,
          annee: 2026,
          trimestre: 1,
          montant_prevu: 5000,
          montant_realise: null,
          created_by: 'admin-1',
        }),
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields including taux_realisation and updated_by', async () => {
      prisma.ptbaActivite.update.mockResolvedValue({ id: 'a1' });

      await repo.update('a1', { statut: PtbaStatut.TERMINE, tauxRealisation: 100, updatedBy: 'a' });

      expect(prisma.ptbaActivite.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: expect.objectContaining({
          statut: PtbaStatut.TERMINE,
          taux_realisation: 100,
          updated_by: 'a',
        }),
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.ptbaActivite.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.ptbaActivite.delete.mockResolvedValue({ id: 'a1' });
      await repo.softDelete('a1');
      expect(prisma.ptbaActivite.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
    });
  });
});
