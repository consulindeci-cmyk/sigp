import { Request } from 'express';
import { LogframeLevel, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { LogframeObjectiveController } from './logframe-objective.controller';
import { LogframeObjectiveService } from './logframe-objective.service';
import { LogframeObjectiveQueryDto } from './dto/logframe-objective-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<LogframeObjectiveService>;
}

const admin: AuthenticatedUser = { id: 'admin-1', email: 'admin@sigp.local', role: UserRole.ADMIN };

const req = {
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' },
  headers: { 'user-agent': 'Jest/1.0' },
} as unknown as Request;

describe('LogframeObjectiveController', () => {
  let controller: LogframeObjectiveController;
  let service: jest.Mocked<LogframeObjectiveService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new LogframeObjectiveController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /logframe-objectives delegates to service.findAll and returns the data array', async () => {
    const obj = { id: 'o1' } as never;
    service.findAll.mockResolvedValue({ data: [obj], meta: {} } as never);
    const query = new LogframeObjectiveQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual([obj]);
  });

  it('GET /logframe-objectives/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'o1' } as never);

    await controller.findOne('o1');

    expect(service.findOne).toHaveBeenCalledWith('o1');
  });

  it('POST /logframe-objectives delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'o1' } as never);
    const dto = {
      projectId: 'proj-1',
      niveau: LogframeLevel.OBJECTIF_GLOBAL,
      code: 'OG-1',
      libelle: 'Objectif',
    };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /logframe-objectives/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'o1' } as never);

    await controller.update('o1', { libelle: 'Nouveau' }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'o1',
      { libelle: 'Nouveau' },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /logframe-objectives/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('o1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Objectif supprimé' });
  });
});
