import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { RisqueController } from './risque.controller';
import { RisqueService } from './risque.service';
import { RisqueQueryDto } from './dto/risque-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<RisqueService>;
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

describe('RisqueController', () => {
  let controller: RisqueController;
  let service: jest.Mocked<RisqueService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new RisqueController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /risques delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new RisqueQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /risques/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'risk-1' } as never);

    await controller.findOne('risk-1');

    expect(service.findOne).toHaveBeenCalledWith('risk-1');
  });

  it('POST /risques delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'risk-1' } as never);
    const dto = {
      projectId: 'proj-1',
      description: 'Risque test',
      probabilite: 'POSSIBLE',
      impact: 'IMPORTANT',
    };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /risques/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'risk-1' } as never);

    await controller.update('risk-1', { statut: 'EN_COURS' as never }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'risk-1',
      { statut: 'EN_COURS' },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /risques/:id soft-deletes and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('risk-1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'risk-1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Risque supprimé' });
  });
});
