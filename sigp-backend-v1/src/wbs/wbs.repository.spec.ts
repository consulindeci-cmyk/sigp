import { WbsNodeType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { WbsRepository, FindWbsNodesParams } from './wbs.repository';

interface PrismaMock {
  wbsNode: {
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
    wbsNode: {
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

describe('WbsRepository', () => {
  let repo: WbsRepository;
  let prisma: PrismaMock;

  const baseParams: FindWbsNodesParams = { skip: 0, take: 20, orderBy: { created_at: 'desc' } };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new WbsRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns nodes + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'n1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ nodes: [{ id: 'n1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on code and libelle', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'phase' });

      const args = prisma.wbsNode.findMany.mock.calls[0][0] as { where: { OR: unknown[] } };
      expect(args.where.OR).toEqual([
        { code: { contains: 'phase', mode: 'insensitive' } },
        { libelle: { contains: 'phase', mode: 'insensitive' } },
      ]);
    });

    it('applies projectId, parentId, objectiveId, type and actif filters', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({
        ...baseParams,
        projectId: 'proj-1',
        parentId: 'par-1',
        objectiveId: 'obj-1',
        type: WbsNodeType.LOT,
        actif: true,
      });

      const args = prisma.wbsNode.findMany.mock.calls[0][0] as {
        where: {
          project_id: string;
          parent_id: string;
          objective_id: string;
          type: WbsNodeType;
          actif: boolean;
        };
      };
      expect(args.where.project_id).toBe('proj-1');
      expect(args.where.parent_id).toBe('par-1');
      expect(args.where.objective_id).toBe('obj-1');
      expect(args.where.type).toBe(WbsNodeType.LOT);
      expect(args.where.actif).toBe(true);
    });
  });

  describe('lookups', () => {
    it('findById queries by id via findFirst', async () => {
      prisma.wbsNode.findFirst.mockResolvedValue({ id: 'n1' });
      await repo.findById('n1');
      expect(prisma.wbsNode.findFirst).toHaveBeenCalledWith({ where: { id: 'n1' } });
    });

    it('findByProject queries by project_id via findMany', async () => {
      prisma.wbsNode.findMany.mockResolvedValue([]);
      await repo.findByProject('proj-1');
      expect(prisma.wbsNode.findMany).toHaveBeenCalledWith({ where: { project_id: 'proj-1' } });
    });

    it('findChildren queries by parent_id via findMany', async () => {
      prisma.wbsNode.findMany.mockResolvedValue([]);
      await repo.findChildren('par-1');
      expect(prisma.wbsNode.findMany).toHaveBeenCalledWith({ where: { parent_id: 'par-1' } });
    });
  });

  describe('create()', () => {
    it('maps camelCase fields to Prisma snake_case columns and defaults nullables', async () => {
      prisma.wbsNode.create.mockResolvedValue({ id: 'n1' });

      await repo.create({
        projectId: 'proj-1',
        code: 'WBS-1',
        libelle: 'Phase',
        type: WbsNodeType.PHASE,
        niveau: 1,
        parentId: 'par-1',
        objectiveId: 'obj-1',
        createdBy: 'admin-1',
      });

      expect(prisma.wbsNode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          project_id: 'proj-1',
          parent_id: 'par-1',
          objective_id: 'obj-1',
          code: 'WBS-1',
          type: WbsNodeType.PHASE,
          niveau: 1,
          ordre: 0,
          created_by: 'admin-1',
        }),
      });
    });
  });

  describe('update()', () => {
    it('forwards mutable fields including niveau, parent_id, actif and updated_by', async () => {
      prisma.wbsNode.update.mockResolvedValue({ id: 'n1' });

      await repo.update('n1', { parentId: 'par-2', niveau: 3, actif: false, updatedBy: 'a' });

      expect(prisma.wbsNode.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: expect.objectContaining({
          parent_id: 'par-2',
          niveau: 3,
          actif: false,
          updated_by: 'a',
        }),
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.wbsNode.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.wbsNode.delete.mockResolvedValue({ id: 'n1' });
      await repo.softDelete('n1');
      expect(prisma.wbsNode.delete).toHaveBeenCalledWith({ where: { id: 'n1' } });
    });
  });
});
