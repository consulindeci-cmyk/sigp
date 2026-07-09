import { Notification, TypeNotification } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationRepository } from './notification.repository';

const USER_ID = 'user-0001-0000-0000-000000000000';
const PROJECT_ID = 'proj-0001-0000-0000-000000000000';
const NOTIF_ID = 'notif-001-0000-0000-000000000000';

function buildNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: NOTIF_ID,
    user_id: USER_ID,
    project_id: PROJECT_ID,
    type: TypeNotification.RISQUE_CRITIQUE,
    titre: 'Risque critique détecté',
    message: 'Un risque critique a été détecté sur le projet.',
    lue: false,
    data: null,
    expires_at: null,
    created_by: null,
    updated_by: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

function buildPrisma() {
  const notification = {
    findMany: jest.fn().mockResolvedValue([buildNotification()]),
    findFirst: jest.fn().mockResolvedValue(buildNotification()),
    create: jest.fn().mockResolvedValue(buildNotification()),
    update: jest.fn().mockResolvedValue(buildNotification()),
    count: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    notification,
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  return { prisma, notification };
}

describe('NotificationRepository', () => {
  let repo: NotificationRepository;
  let notification: ReturnType<typeof buildPrisma>['notification'];

  beforeEach(() => {
    const mocks = buildPrisma();
    repo = new NotificationRepository(mocks.prisma);
    notification = mocks.notification;
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findManyPaginated ───────────────────────────────────────────────────────

  describe('findManyPaginated()', () => {
    it('returns notifications and total via $transaction', async () => {
      const result = await repo.findManyPaginated({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies userId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        userId: USER_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: USER_ID }),
        }),
      );
    });

    it('applies projectId filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        projectId: PROJECT_ID,
        orderBy: { created_at: 'desc' },
      });

      expect(notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ project_id: PROJECT_ID }),
        }),
      );
    });

    it('applies type filter', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        type: TypeNotification.BUDGET_DEPASSE,
        orderBy: { created_at: 'desc' },
      });

      expect(notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: TypeNotification.BUDGET_DEPASSE }),
        }),
      );
    });

    it('applies lue filter (false)', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        lue: false,
        orderBy: { created_at: 'desc' },
      });

      expect(notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ lue: false }),
        }),
      );
    });

    it('applies lue filter (true)', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        lue: true,
        orderBy: { created_at: 'desc' },
      });

      expect(notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ lue: true }),
        }),
      );
    });

    it('builds OR search on titre and message', async () => {
      await repo.findManyPaginated({
        skip: 0,
        take: 20,
        search: 'critique',
        orderBy: { created_at: 'desc' },
      });

      expect(notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ titre: expect.objectContaining({ contains: 'critique' }) }),
              expect.objectContaining({
                message: expect.objectContaining({ contains: 'critique' }),
              }),
            ]),
          }),
        }),
      );
    });

    it('returns empty where clause when no filters provided', async () => {
      await repo.findManyPaginated({ skip: 0, take: 20, orderBy: { created_at: 'desc' } });

      expect(notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls findFirst with the given id', async () => {
      await repo.findById(NOTIF_ID);

      expect(notification.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: NOTIF_ID }) }),
      );
    });

    it('returns null when not found', async () => {
      notification.findFirst.mockResolvedValueOnce(null);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  // ─── findByUser ──────────────────────────────────────────────────────────────

  describe('findByUser()', () => {
    it('filters by user_id', async () => {
      await repo.findByUser(USER_ID);

      expect(notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: USER_ID } }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('maps camelCase to snake_case fields', async () => {
      await repo.create({
        userId: USER_ID,
        type: TypeNotification.RISQUE_CRITIQUE,
        titre: 'Risque critique',
        message: 'Un risque critique détecté.',
      });

      expect(notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: USER_ID,
            titre: 'Risque critique',
          }),
        }),
      );
    });

    it('stores optional projectId', async () => {
      await repo.create({
        userId: USER_ID,
        projectId: PROJECT_ID,
        type: TypeNotification.RISQUE_CRITIQUE,
        titre: 'Titre',
        message: 'Message',
      });

      expect(notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ project_id: PROJECT_ID }),
        }),
      );
    });

    it('stores createdBy from actor', async () => {
      await repo.create({
        userId: USER_ID,
        type: TypeNotification.RISQUE_CRITIQUE,
        titre: 'Titre',
        message: 'Message',
        createdBy: 'admin-1',
      });

      expect(notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ created_by: 'admin-1' }),
        }),
      );
    });

    it('defaults lue to false', async () => {
      await repo.create({
        userId: USER_ID,
        type: TypeNotification.BUDGET_DEPASSE,
        titre: 'Titre',
        message: 'Message',
      });

      expect(notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lue: false }),
        }),
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('calls prisma.update with the given id', async () => {
      await repo.update(NOTIF_ID, { lue: true });

      expect(notification.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: NOTIF_ID } }),
      );
    });

    it('passes lue on update', async () => {
      await repo.update(NOTIF_ID, { lue: true });

      expect(notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lue: true }),
        }),
      );
    });

    it('passes updated_by on update', async () => {
      await repo.update(NOTIF_ID, { updatedBy: 'admin-1' });

      expect(notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ updated_by: 'admin-1' }),
        }),
      );
    });
  });

  // ─── softDelete ──────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('sets deleted_at via prisma.update (soft delete)', async () => {
      await repo.softDelete(NOTIF_ID);

      expect(notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: NOTIF_ID },
          data: expect.objectContaining({ deleted_at: expect.any(Date) }),
        }),
      );
    });
  });
});
