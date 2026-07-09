import { Request } from 'express';
import { PpmMarcheStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { PpmController } from './ppm.controller';
import { PpmService } from './ppm.service';
import { PpmQueryDto } from './dto/ppm-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<PpmService>;
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

describe('PpmController', () => {
  let controller: PpmController;
  let service: jest.Mocked<PpmService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new PpmController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /ppm delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new PpmQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /ppm/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'ppm-1' } as never);

    await controller.findOne('ppm-1');

    expect(service.findOne).toHaveBeenCalledWith('ppm-1');
  });

  it('POST /ppm delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'ppm-1' } as never);
    const dto = {
      projectId: 'proj-1',
      code: 'MRC-001',
      intitule: 'Acquisition matériel',
      type: 'FOURNITURES',
    };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /ppm/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'ppm-1' } as never);

    await controller.update('ppm-1', { statut: PpmMarcheStatus.SIGNE }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'ppm-1',
      { statut: PpmMarcheStatus.SIGNE },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /ppm/:id performs a soft delete and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('ppm-1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'ppm-1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Marché PPM supprimé' });
  });
});
