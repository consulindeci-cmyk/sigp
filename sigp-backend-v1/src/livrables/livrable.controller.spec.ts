import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';
import { LivrableController } from './livrable.controller';
import { LivrableService } from './livrable.service';
import { LivrableQueryDto } from './dto/livrable-query.dto';

function buildServiceMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<LivrableService>;
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

describe('LivrableController', () => {
  let controller: LivrableController;
  let service: jest.Mocked<LivrableService>;

  beforeEach(() => {
    service = buildServiceMock();
    controller = new LivrableController(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('GET /livrables delegates to service.findAll', async () => {
    const paginated = { data: [], meta: {} } as never;
    service.findAll.mockResolvedValue(paginated);
    const query = new LivrableQueryDto();

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe(paginated);
  });

  it('GET /livrables/:id delegates to service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'livr-1' } as never);

    await controller.findOne('livr-1');

    expect(service.findOne).toHaveBeenCalledWith('livr-1');
  });

  it('POST /livrables delegates to service.create with actor context', async () => {
    service.create.mockResolvedValue({ id: 'livr-1' } as never);
    const dto = { projectId: 'proj-1', nom: 'Rapport de lancement' };

    await controller.create(dto as never, admin, req);

    expect(service.create).toHaveBeenCalledWith(
      dto,
      expect.objectContaining({ userId: 'admin-1', ip: '127.0.0.1', userAgent: 'Jest/1.0' }),
    );
  });

  it('PATCH /livrables/:id delegates to service.update with actor context', async () => {
    service.update.mockResolvedValue({ id: 'livr-1' } as never);

    await controller.update('livr-1', { nom: 'Nouveau nom' }, admin, req);

    expect(service.update).toHaveBeenCalledWith(
      'livr-1',
      { nom: 'Nouveau nom' },
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('DELETE /livrables/:id soft-deletes and returns a confirmation message', async () => {
    service.remove.mockResolvedValue(undefined);

    const result = await controller.remove('livr-1', admin, req);

    expect(service.remove).toHaveBeenCalledWith(
      'livr-1',
      expect.objectContaining({ userId: 'admin-1' }),
    );
    expect(result).toEqual({ message: 'Livrable supprimé' });
  });
});
