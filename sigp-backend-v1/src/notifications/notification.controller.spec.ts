import { TypeNotification } from '@prisma/client';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

const USER_ID = 'user-0001-0000-0000-000000000000';
const NOTIF_ID = 'notif-001-0000-0000-000000000000';

function buildResponse(): NotificationResponseDto {
  return {
    id: NOTIF_ID,
    userId: USER_ID,
    projectId: null,
    type: TypeNotification.RISQUE_CRITIQUE,
    titre: 'Risque critique détecté',
    message: 'Un risque critique a été détecté.',
    lue: false,
    data: null,
    expiresAt: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

function buildMocks() {
  const notificationService = {
    findAll: jest.fn().mockResolvedValue({
      data: [buildResponse()],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    }),
    findOne: jest.fn().mockResolvedValue(buildResponse()),
    create: jest.fn().mockResolvedValue(buildResponse()),
    update: jest.fn().mockResolvedValue(buildResponse()),
    remove: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<NotificationService>;

  const controller = new NotificationController(notificationService);
  const user = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' } as unknown;
  const req = { ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' }, headers: {} } as unknown;

  return { controller, notificationService, user, req };
}

describe('NotificationController', () => {
  it('findAll() delegates to service', async () => {
    const { controller, notificationService } = buildMocks();
    const result = await controller.findAll(new NotificationQueryDto());
    expect(notificationService.findAll).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
  });

  it('findOne() delegates to service', async () => {
    const { controller, notificationService } = buildMocks();
    const result = await controller.findOne(NOTIF_ID);
    expect(notificationService.findOne).toHaveBeenCalledWith(NOTIF_ID);
    expect(result.id).toBe(NOTIF_ID);
  });

  it('create() delegates to service with actor context', async () => {
    const { controller, notificationService, user, req } = buildMocks();
    const dto = Object.assign(new CreateNotificationDto(), {
      userId: USER_ID,
      type: TypeNotification.RISQUE_CRITIQUE,
      titre: 'Risque critique',
      message: 'Message',
    });
    await controller.create(dto, user, req);
    expect(notificationService.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('update() delegates to service with actor context', async () => {
    const { controller, notificationService, user, req } = buildMocks();
    const dto = Object.assign(new UpdateNotificationDto(), { lue: true });
    await controller.update(NOTIF_ID, dto, user, req);
    expect(notificationService.update).toHaveBeenCalledWith(
      NOTIF_ID,
      dto,
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('remove() returns success message', async () => {
    const { controller, notificationService, user, req } = buildMocks();
    const result = await controller.remove(NOTIF_ID, user, req);
    expect(notificationService.remove).toHaveBeenCalledWith(
      NOTIF_ID,
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Notification supprimée' });
  });
});
