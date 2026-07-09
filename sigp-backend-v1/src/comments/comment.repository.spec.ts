import { PrismaService } from '@/prisma/prisma.service';
import { CommentRepository, FindCommentsParams } from './comment.repository';

interface PrismaMock {
  comment: {
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
    comment: {
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

const USER_SELECT = { nom: true, prenom: true, role: true, avatar_url: true };

describe('CommentRepository', () => {
  let repo: CommentRepository;
  let prisma: PrismaMock;

  const baseParams: FindCommentsParams = {
    projectId: 'proj-1',
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new CommentRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a $transaction with user include', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'c1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ comments: [{ id: 'c1' }], total: 1 });

      const findManyArg = prisma.comment.findMany.mock.calls[0][0] as { include: unknown };
      expect(findManyArg.include).toEqual({ user: { select: USER_SELECT } });
    });

    it('applies projectId filter', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      await repo.findManyPaginated(baseParams);

      const where = (prisma.comment.findMany.mock.calls[0][0] as { where: { project_id: string } })
        .where;
      expect(where.project_id).toBe('proj-1');
    });

    it('applies statut, priorite and lu filters', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      await repo.findManyPaginated({
        ...baseParams,
        statut: 'OUVERT',
        priorite: 'HAUTE',
        lu: false,
      });

      const where = (prisma.comment.findMany.mock.calls[0][0] as { where: Record<string, unknown> })
        .where;
      expect(where.statut).toBe('OUVERT');
      expect(where.priorite).toBe('HAUTE');
      expect(where.lu).toBe(false);
    });

    it('builds a case-insensitive OR search on message, element_nom and mention', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      await repo.findManyPaginated({ ...baseParams, search: 'risque' });

      const where = (prisma.comment.findMany.mock.calls[0][0] as { where: { OR: unknown[] } })
        .where;
      expect(where.OR).toEqual([
        { message: { contains: 'risque', mode: 'insensitive' } },
        { element_nom: { contains: 'risque', mode: 'insensitive' } },
        { mention: { contains: 'risque', mode: 'insensitive' } },
      ]);
    });
  });

  describe('findById()', () => {
    it('queries by id via findFirst with user include', async () => {
      prisma.comment.findFirst.mockResolvedValue({ id: 'c1' });
      await repo.findById('c1');
      expect(prisma.comment.findFirst).toHaveBeenCalledWith({
        where: { id: 'c1' },
        include: { user: { select: USER_SELECT } },
      });
    });
  });

  describe('create()', () => {
    it('maps camelCase fields to Prisma snake_case and includes user', async () => {
      prisma.comment.create.mockResolvedValue({ id: 'c1' });

      await repo.create({
        projectId: 'proj-1',
        userId: 'user-1',
        message: 'Bonjour',
        statut: 'OUVERT',
        priorite: 'NORMALE',
        module: 'Projet',
        elementId: 'PRJ-001',
        elementNom: 'Infos générales',
      });

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          project_id: 'proj-1',
          user_id: 'user-1',
          message: 'Bonjour',
          statut: 'OUVERT',
          priorite: 'NORMALE',
          module: 'Projet',
          element_id: 'PRJ-001',
          element_nom: 'Infos générales',
        }),
        include: { user: { select: USER_SELECT } },
      });
    });

    it('defaults statut to OUVERT and priorite to NORMALE when omitted', async () => {
      prisma.comment.create.mockResolvedValue({ id: 'c1' });
      await repo.create({ projectId: 'p', userId: 'u', message: 'Test' });

      const data = (
        prisma.comment.create.mock.calls[0][0] as { data: { statut: string; priorite: string } }
      ).data;
      expect(data.statut).toBe('OUVERT');
      expect(data.priorite).toBe('NORMALE');
    });
  });

  describe('update()', () => {
    it('forwards mutable fields with user include', async () => {
      prisma.comment.update.mockResolvedValue({ id: 'c1' });
      await repo.update('c1', { statut: 'RESOLU', lu: true });

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: expect.objectContaining({ statut: 'RESOLU', lu: true }),
        include: { user: { select: USER_SELECT } },
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.comment.delete (intercepted by soft-delete middleware)', async () => {
      prisma.comment.delete.mockResolvedValue({ id: 'c1' });
      await repo.softDelete('c1');
      expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });
  });
});
