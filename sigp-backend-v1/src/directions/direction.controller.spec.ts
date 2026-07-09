import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { DirectionController } from './direction.controller';
import { DirectionService } from './direction.service';
import { DirectionQueryDto } from './dto/direction-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<DirectionService>;
}

const admin: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@sigp.local',
  role: UserRole.ADMIN,
};

const req = {
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' },
  headers: { 'user-agent': 'Jest/1.0' },
} as unknown as Request;

describe('DirectionController', () => {
  let controller: DirectionController;
  let service: jest.Mocked<DirectionService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new DirectionController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /directions delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new DirectionQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /directions/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'd1' } as never);

    await controller.findOne('d1');

    expect(service.findOne).toHaveBeenCalledWith('d1');
  });

  it('POST /directions delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'd1' } as never);
    const dto = { organisationId: 'org-1', code: 'DIR-TECH', nom: 'Direction Technique' };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /directions/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'd1' } as never);

    await controller.update('d1', { nom: 'Nouveau' }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'd1',
      { nom: 'Nouveau' },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /directions/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('d1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'd1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Direction supprimée' });
  });
});
