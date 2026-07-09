import { OrganisationType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { OrganisationRepository, FindOrganisationsParams } from './organisation.repository';

interface PrismaMock {
  organisation: {
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
    organisation: {
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

describe('OrganisationRepository', () => {
  let repo: OrganisationRepository;
  let prisma: PrismaMock;

  const baseParams: FindOrganisationsParams = {
    skip: 0,
    take: 20,
    orderBy: { created_at: 'desc' },
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    repo = new OrganisationRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findManyPaginated()', () => {
    it('runs findMany + count in a single $transaction and returns organisations + total', async () => {
      prisma.$transaction.mockResolvedValue([[{ id: 'o1' }], 1]);

      const result = await repo.findManyPaginated(baseParams);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ organisations: [{ id: 'o1' }], total: 1 });
    });

    it('builds a case-insensitive OR search on nom, code and description', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, search: 'sante' });

      const args = prisma.organisation.findMany.mock.calls[0][0] as { where: { OR: unknown[] } };
      expect(args.where.OR).toEqual([
        { nom: { contains: 'sante', mode: 'insensitive' } },
        { code: { contains: 'sante', mode: 'insensitive' } },
        { description: { contains: 'sante', mode: 'insensitive' } },
      ]);
    });

    it('applies type and actif filters when provided', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({
        ...baseParams,
        type: OrganisationType.MINISTERE,
        actif: true,
      });

      const args = prisma.organisation.findMany.mock.calls[0][0] as {
        where: { type: OrganisationType; actif: boolean };
      };
      expect(args.where.type).toBe(OrganisationType.MINISTERE);
      expect(args.where.actif).toBe(true);
    });

    it('passes pagination (skip/take) and orderBy through to Prisma', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findManyPaginated({ ...baseParams, skip: 40, take: 10, orderBy: { nom: 'asc' } });

      const args = prisma.organisation.findMany.mock.calls[0][0] as {
        skip: number;
        take: number;
        orderBy: unknown;
      };
      expect(args.skip).toBe(40);
      expect(args.take).toBe(10);
      expect(args.orderBy).toEqual({ nom: 'asc' });
    });
  });

  describe('lookups', () => {
    it('findById queries by id via findFirst', async () => {
      prisma.organisation.findFirst.mockResolvedValue({ id: 'o1' });
      await repo.findById('o1');
      expect(prisma.organisation.findFirst).toHaveBeenCalledWith({ where: { id: 'o1' } });
    });

    it('findByCode queries by code', async () => {
      prisma.organisation.findFirst.mockResolvedValue(null);
      await repo.findByCode('MIN-SANTE');
      expect(prisma.organisation.findFirst).toHaveBeenCalledWith({ where: { code: 'MIN-SANTE' } });
    });

    it('findByName queries by nom', async () => {
      prisma.organisation.findFirst.mockResolvedValue(null);
      await repo.findByName('Ministère');
      expect(prisma.organisation.findFirst).toHaveBeenCalledWith({ where: { nom: 'Ministère' } });
    });
  });

  describe('create()', () => {
    it('maps siteWeb to the site_web Prisma column and defaults nullables', async () => {
      prisma.organisation.create.mockResolvedValue({ id: 'o1' });

      await repo.create({
        code: 'MIN-SANTE',
        nom: 'Ministère de la Santé',
        type: OrganisationType.MINISTERE,
        siteWeb: 'https://sante.gouv',
        createdBy: 'admin-1',
      });

      expect(prisma.organisation.create).toHaveBeenCalledWith({
        data: {
          code: 'MIN-SANTE',
          nom: 'Ministère de la Santé',
          type: OrganisationType.MINISTERE,
          description: null,
          email: null,
          telephone: null,
          site_web: 'https://sante.gouv',
          created_by: 'admin-1',
        },
      });
    });
  });

  describe('update()', () => {
    it('maps siteWeb to site_web and forwards mutable fields', async () => {
      prisma.organisation.update.mockResolvedValue({ id: 'o1' });

      await repo.update('o1', {
        nom: 'Nouveau',
        actif: false,
        siteWeb: 'https://x.y',
        updatedBy: 'a',
      });

      expect(prisma.organisation.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: {
          nom: 'Nouveau',
          type: undefined,
          description: undefined,
          email: undefined,
          telephone: undefined,
          site_web: 'https://x.y',
          actif: false,
          updated_by: 'a',
        },
      });
    });
  });

  describe('softDelete()', () => {
    it('calls prisma.organisation.delete (intercepted by the soft-delete middleware)', async () => {
      prisma.organisation.delete.mockResolvedValue({ id: 'o1' });
      await repo.softDelete('o1');
      expect(prisma.organisation.delete).toHaveBeenCalledWith({ where: { id: 'o1' } });
    });
  });
});
