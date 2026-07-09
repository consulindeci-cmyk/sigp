import { AuditAction, Notification, TypeNotification } from '@prisma/client';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { AuditService } from '@/audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from '@/users/users.service';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';

beforeEach(() => {
  jest
    .spyOn(global, 'setImmediate')
    .mockImplementation(((fn: () => void) => fn()) as unknown as typeof setImmediate);
});

afterEach(() => jest.restoreAllMocks());

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

function buildMocks() {
  const notificationRepository = {
    findManyPaginated: jest.fn(),
    findById: jest.fn(),
    findByUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<NotificationRepository>;

  const usersService = {
    findOne: jest.fn().mockResolvedValue({ id: USER_ID }),
  } as unknown as jest.Mocked<UsersService>;

  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuditService>;

  const eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

  const service = new NotificationService(
    notificationRepository,
    usersService,
    auditService,
    eventEmitter,
  );

  return { service, notificationRepository, usersService, auditService, eventEmitter };
}

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('NotificationService.findAll()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.notificationRepository.findManyPaginated.mockResolvedValue({
      notifications: [buildNotification()],
      total: 1,
    });
  });

  it('returns a paginated result with mapped fields', async () => {
    const result = await mocks.service.findAll(new NotificationQueryDto());

    expect(result.meta.total).toBe(1);
    expect(result.data[0].userId).toBe(USER_ID);
    expect(result.data[0].titre).toBe('Risque critique détecté');
    expect(result.data[0].lue).toBe(false);
  });

  it('forwards all query filters to the repository', async () => {
    const query = Object.assign(new NotificationQueryDto(), {
      userId: USER_ID,
      type: TypeNotification.BUDGET_DEPASSE,
      lue: false,
    });
    await mocks.service.findAll(query);

    expect(mocks.notificationRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        type: TypeNotification.BUDGET_DEPASSE,
        lue: false,
      }),
    );
  });

  it('falls back to created_at when sortBy is not whitelisted (anti-injection)', async () => {
    const query = Object.assign(new NotificationQueryDto(), {
      sortBy: 'user_id; DROP TABLE',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.notificationRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (lue)', async () => {
    const query = Object.assign(new NotificationQueryDto(), { sortBy: 'lue', sortOrder: 'asc' });
    await mocks.service.findAll(query);

    expect(mocks.notificationRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { lue: 'asc' } }),
    );
  });

  it('honours whitelisted sort field (type)', async () => {
    const query = Object.assign(new NotificationQueryDto(), { sortBy: 'type', sortOrder: 'desc' });
    await mocks.service.findAll(query);

    expect(mocks.notificationRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { type: 'desc' } }),
    );
  });

  it('honours whitelisted sort field (expires_at)', async () => {
    const query = Object.assign(new NotificationQueryDto(), {
      sortBy: 'expires_at',
      sortOrder: 'asc',
    });
    await mocks.service.findAll(query);

    expect(mocks.notificationRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { expires_at: 'asc' } }),
    );
  });
});

// ─── findOne ─────────────────────────────────────────────────────────────────

describe('NotificationService.findOne()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
  });

  it('returns a NotificationResponseDto for an existing notification', async () => {
    mocks.notificationRepository.findById.mockResolvedValue(buildNotification());

    const result = await mocks.service.findOne(NOTIF_ID);

    expect(result.id).toBe(NOTIF_ID);
    expect(result.userId).toBe(USER_ID);
    expect(result.type).toBe(TypeNotification.RISQUE_CRITIQUE);
  });

  it('throws NOTIFICATION_NOT_FOUND when it does not exist', async () => {
    mocks.notificationRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.findOne('missing')).rejects.toMatchObject({
      errorCode: ErrorCode.NOTIFICATION_NOT_FOUND,
    });
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('NotificationService.create()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.notificationRepository.create.mockResolvedValue(buildNotification());
  });

  it('creates a notification after validating the user', async () => {
    await mocks.service.create({
      userId: USER_ID,
      type: TypeNotification.RISQUE_CRITIQUE,
      titre: 'Titre',
      message: 'Message',
    });

    expect(mocks.usersService.findOne).toHaveBeenCalledWith(USER_ID);
    expect(mocks.notificationRepository.create).toHaveBeenCalled();
  });

  it('throws 404 when userId does not exist', async () => {
    mocks.usersService.findOne.mockRejectedValue(
      new NotFoundException(ErrorCode.USER_NOT_FOUND, 'Utilisateur introuvable'),
    );

    await expect(
      mocks.service.create({
        userId: USER_ID,
        type: TypeNotification.RISQUE_CRITIQUE,
        titre: 'Titre',
        message: 'Message',
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.USER_NOT_FOUND });
    expect(mocks.notificationRepository.create).not.toHaveBeenCalled();
  });

  it('converts expiresAt string to Date', async () => {
    await mocks.service.create({
      userId: USER_ID,
      type: TypeNotification.RISQUE_CRITIQUE,
      titre: 'Titre',
      message: 'Message',
      expiresAt: '2026-12-31',
    });

    expect(mocks.notificationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: expect.any(Date) }),
    );
  });

  it('passes null expiresAt when not provided', async () => {
    await mocks.service.create({
      userId: USER_ID,
      type: TypeNotification.RISQUE_CRITIQUE,
      titre: 'Titre',
      message: 'Message',
    });

    expect(mocks.notificationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: null }),
    );
  });

  it('writes a CREATE audit log and emits NOTIFICATION_CREATED', async () => {
    await mocks.service.create(
      { userId: USER_ID, type: TypeNotification.RISQUE_CRITIQUE, titre: 'T', message: 'M' },
      { userId: 'admin-1', ip: '127.0.0.1' },
    );

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: AuditAction.CREATE,
        tableCible: 'notifications',
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.NOTIFICATION_CREATED,
      expect.objectContaining({ notificationId: NOTIF_ID }),
    );
  });

  it('passes createdBy from actor userId', async () => {
    await mocks.service.create(
      { userId: USER_ID, type: TypeNotification.RISQUE_CRITIQUE, titre: 'T', message: 'M' },
      { userId: 'admin-1' },
    );

    expect(mocks.notificationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'admin-1' }),
    );
  });

  it('defaults lue to false when not provided', async () => {
    await mocks.service.create({
      userId: USER_ID,
      type: TypeNotification.RISQUE_CRITIQUE,
      titre: 'Titre',
      message: 'Message',
    });

    expect(mocks.notificationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ lue: false }),
    );
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('NotificationService.update()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.notificationRepository.findById.mockResolvedValue(buildNotification());
    mocks.notificationRepository.update.mockResolvedValue(buildNotification({ lue: true }));
  });

  it('throws NOTIFICATION_NOT_FOUND when it does not exist', async () => {
    mocks.notificationRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.update('missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('writes an UPDATE audit log with avant/apres and emits NOTIFICATION_UPDATED', async () => {
    await mocks.service.update(NOTIF_ID, { lue: true }, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        tableCible: 'notifications',
        avant: expect.any(Object),
        apres: expect.any(Object),
      }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(AppEvent.NOTIFICATION_UPDATED, {
      notificationId: NOTIF_ID,
    });
  });

  it('converts expiresAt string to Date on update', async () => {
    await mocks.service.update(NOTIF_ID, { expiresAt: '2026-12-31' });

    expect(mocks.notificationRepository.update).toHaveBeenCalledWith(
      NOTIF_ID,
      expect.objectContaining({ expiresAt: expect.any(Date) }),
    );
  });

  it('passes updatedBy from actor userId', async () => {
    await mocks.service.update(NOTIF_ID, { lue: true }, { userId: 'admin-1' });

    expect(mocks.notificationRepository.update).toHaveBeenCalledWith(
      NOTIF_ID,
      expect.objectContaining({ updatedBy: 'admin-1' }),
    );
  });
});

// ─── remove ──────────────────────────────────────────────────────────────────

describe('NotificationService.remove()', () => {
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    mocks.notificationRepository.findById.mockResolvedValue(buildNotification());
  });

  it('throws NOTIFICATION_NOT_FOUND when it does not exist', async () => {
    mocks.notificationRepository.findById.mockResolvedValue(null);

    await expect(mocks.service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.notificationRepository.softDelete).not.toHaveBeenCalled();
  });

  it('soft-deletes the notification via the repository', async () => {
    await mocks.service.remove(NOTIF_ID);

    expect(mocks.notificationRepository.softDelete).toHaveBeenCalledWith(NOTIF_ID);
  });

  it('writes a DELETE audit log and emits NOTIFICATION_DELETED', async () => {
    await mocks.service.remove(NOTIF_ID, { userId: 'admin-1' });

    expect(mocks.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.DELETE, tableCible: 'notifications' }),
    );
    expect(mocks.eventEmitter.emit).toHaveBeenCalledWith(
      AppEvent.NOTIFICATION_DELETED,
      expect.objectContaining({ notificationId: NOTIF_ID }),
    );
  });
});
