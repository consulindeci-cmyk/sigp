import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersRepository, FindUsersParams } from './users.repository';

interface PrismaMock {
  user: {
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
    user: {
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

describe('UsersRepository', () => {
  let repo: UsersRepository;
  let prisma: PrismaMock;

  const baseParams: FindUsersParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new UsersRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count inside a single $transaction and returns users + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'u1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ users: [{ id: 'u1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on nom, prenom and email', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'john' });

      const findManyArgs = prisma.user.findMany.mock.calls[0][0] as {
        where: { OR: unknown[] };
      };
      expect(findManyArgs.where.OR).toEqual([
        { nom: { contains: 'john', mode: 'insensitive' } },
        { prenom: { contains: 'john', mode: 'insensitive' } },
        { email: { contains: 'john', mode: 'insensitive' } },
      ]);
    });

    it('applies role and actif filters when provided', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, role: UserRole.ADMIN, actif: false });

      const findManyArgs = prisma.user.findMany.mock.calls[0][0] as {
        where: { role: UserRole; actif: boolean };
      };
      expect(findManyArgs.where.role).toBe(UserRole.ADMIN);
      expect(findManyArgs.where.actif).toBe(false);
    });
  });

  describe('findById() / findByEmail()', () => {
    it('findById queries by id via findFirst (soft-deleted excluded by middleware)', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u1' });

      await repo.findById('u1');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('findByEmail queries by email via findFirst', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await repo.findByEmail('john@sigp.local');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { email: 'john@sigp.local' } });
    });
  });

  describe('create()', () => {
    it('maps motDePasse to the mot_de_passe Prisma column', async () => {
      prisma.user.create.mockResolvedValue({ id: 'u1' });

      await repo.create({
        nom: 'Doe',
        prenom: 'John',
        email: 'john@sigp.local',
        motDePasse: '$argon2id$hash',
        role: UserRole.VIEWER,
        telephone: null,
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          nom: 'Doe',
          prenom: 'John',
          email: 'john@sigp.local',
          mot_de_passe: '$argon2id$hash',
          role: UserRole.VIEWER,
          telephone: null,
        },
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.user.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.user.delete.mockResolvedValue({ id: 'u1' });

      await repo.softDelete('u1');

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });
  });
});
