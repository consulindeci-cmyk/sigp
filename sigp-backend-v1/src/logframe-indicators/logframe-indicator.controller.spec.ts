import { Request } from 'express';
import { IndicatorType, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { LogframeIndicatorController } from './logframe-indicator.controller';
import { LogframeIndicatorService } from './logframe-indicator.service';
import { LogframeIndicatorQueryDto } from './dto/logframe-indicator-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<LogframeIndicatorService>;
}

const admin: AuthenticatedUser = { id: 'admin-1', email: 'admin@sigp.local', role: UserRole.ADMIN };

const req = {
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' },
  headers: { 'user-agent': 'Jest/1.0' },
} as unknown as Request;

describe('LogframeIndicatorController', () => {
  let controller: LogframeIndicatorController;
  let service: jest.Mocked<LogframeIndicatorService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new LogframeIndicatorController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /logframe-indicators delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new LogframeIndicatorQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /logframe-indicators/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'i1' } as never);

    await controller.findOne('i1');

    expect(service.findOne).toHaveBeenCalledWith('i1');
  });

  it('POST /logframe-indicators delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'i1' } as never);
    const dto = {
      objectiveId: 'obj-1',
      code: 'IND-1',
      libelle: 'Taux',
      type: IndicatorType.OUTPUT,
    };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /logframe-indicators/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'i1' } as never);

    await controller.update('i1', { valeurActuelle: 62.3 }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'i1',
      { valeurActuelle: 62.3 },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /logframe-indicators/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('i1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'i1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Indicateur supprimé' });
  });
});
