import { RoleMembreProjet } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ProjectMemberRepository, FindProjectMembersParams } from './project-member.repository';

interface PrismaMock {
  projectMember: {
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
    projectMember: {
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

describe('ProjectMemberRepository', () => {
  let repo: ProjectMemberRepository;
  let prisma: PrismaMock;

  const baseParams: FindProjectMembersParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new ProjectMemberRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns members + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'm1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ members: [{ id: 'm1' }], total: 1 });
    });

    it('builds a case-insensitive search on the related user (nom, prenom, email)', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'john' });

      const args = prisma.projectMember.findMany.mock.calls[0][0] as {
        where: { user: { OR: unknown[] } };
      };
      expect(args.where.user.OR).toEqual([
        { nom: { contains: 'john', mode: 'insensitive' } },
        { prenom: { contains: 'john', mode: 'insensitive' } },
        { email: { contains: 'john', mode: 'insensitive' } },
      ]);
    });

    it('applies projectId, userId, role and actif filters', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({
        ...baseParams,
        projectId: 'proj-1',
        userId: 'usr-1',
        role: RoleMembreProjet.CHEF_PROJET,
        actif: true,
      });

      const args = prisma.projectMember.findMany.mock.calls[0][0] as {
        where: {
          project_id: string;
          user_id: string;
          role_projet: RoleMembreProjet;
          actif: boolean;
        };
      };
      expect(args.where.project_id).toBe('proj-1');
      expect(args.where.user_id).toBe('usr-1');
      expect(args.where.role_projet).toBe(RoleMembreProjet.CHEF_PROJET);
      expect(args.where.actif).toBe(true);
    });
  });

  describe('scoped lookups', () => {
    it('findById queries by id via findFirst', async () => {
      prisma.projectMember.findFirst.mockResolvedValue({ id: 'm1' });
      await repo.findById('m1');
      expect(prisma.projectMember.findFirst).toHaveBeenCalledWith({ where: { id: 'm1' } });
    });

    it('findByProject queries by project_id via findMany', async () => {
      prisma.projectMember.findMany.mockResolvedValue([]);
      await repo.findByProject('proj-1');
      expect(prisma.projectMember.findMany).toHaveBeenCalledWith({
        where: { project_id: 'proj-1' },
      });
    });

    it('findByUser queries by user_id via findMany', async () => {
      prisma.projectMember.findMany.mockResolvedValue([]);
      await repo.findByUser('usr-1');
      expect(prisma.projectMember.findMany).toHaveBeenCalledWith({ where: { user_id: 'usr-1' } });
    });

    it('findByProjectAndUser queries the (project_id, user_id) couple', async () => {
      prisma.projectMember.findFirst.mockResolvedValue(null);
      await repo.findByProjectAndUser('proj-1', 'usr-1');
      expect(prisma.projectMember.findFirst).toHaveBeenCalledWith({
        where: { project_id: 'proj-1', user_id: 'usr-1' },
      });
    });
  });

  describe('create()', () => {
    it('maps role to role_projet and ids to snake_case columns', async () => {
      prisma.projectMember.create.mockResolvedValue({ id: 'm1' });

      await repo.create({
        projectId: 'proj-1',
        userId: 'usr-1',
        role: RoleMembreProjet.MEMBRE,
        createdBy: 'admin-1',
      });

      expect(prisma.projectMember.create).toHaveBeenCalledWith({
        data: {
          project_id: 'proj-1',
          user_id: 'usr-1',
          role_projet: RoleMembreProjet.MEMBRE,
          created_by: 'admin-1',
        },
      });
    });
  });

  describe('update()', () => {
    it('forwards role_projet, actif and updated_by', async () => {
      prisma.projectMember.update.mockResolvedValue({ id: 'm1' });

      await repo.update('m1', { role: RoleMembreProjet.VALIDATEUR, actif: false, updatedBy: 'a' });

      expect(prisma.projectMember.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: {
          role_projet: RoleMembreProjet.VALIDATEUR,
          actif: false,
          updated_by: 'a',
        },
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.projectMember.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.projectMember.delete.mockResolvedValue({ id: 'm1' });
      await repo.softDelete('m1');
      expect(prisma.projectMember.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    });
  });
});
